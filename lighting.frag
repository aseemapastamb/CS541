/////////////////////////////////////////////////////////////////////////
// Pixel shader for lighting
////////////////////////////////////////////////////////////////////////
#version 330

// These definitions agree with the ObjectIds enum in scene.h
const int     nullId	= 0;
const int     skyId     = 1;
const int     seaId     = 2;
const int     groundId	= 3;
const int     roomId	= 4;
const int     boxId     = 5;
const int     frameId	= 6;
const int     lPicId	= 7;
const int     rPicId	= 8;
const int     teapotId	= 9;
const int     spheresId	= 10;
const int     floorId	= 11;

in vec3 tanVec;
in vec3 normalVec;
in vec3 eyeVec;
in vec3 lightVec;
in vec2 texCoord;
in vec4 shadowCoord;

uniform int objectId;
uniform vec3 diffuse;
uniform vec3 specular;
uniform float shininess;
uniform vec3 lightVal;
uniform vec3 lightAmb;
uniform int mode;
uniform int shadows;
uniform sampler2D shadowMap;
uniform sampler2D textureMap;
uniform sampler2D normalMap;
uniform sampler2D irrMap;
uniform sampler2D skyMap;

vec4 FragColor;

vec3 LightingPixel() {
    // Compute unit vector N, L, V for lighting calc
    vec3 N = normalize(normalVec);
    vec3 L = normalize(lightVec);
    vec3 V = normalize(eyeVec);

    // linear color from irradiance maps gamma color
    vec2 uv = vec2(atan(N.y, N.x) / (2 * 3.141592f), acos(N.z) / 3.141592f);
    vec3 cG = texture(irrMap, uv).xyz;
    vec3 cL = vec3(pow(cG.x, 2.2f), pow(cG.y, 2.2f), pow(cG.z, 2.2f));
    
    // Values describing surface
    vec3 Kd = diffuse;
    vec3 Ks = specular;
    float alpha = shininess;

    // Textures
    if (objectId == roomId ||
        objectId == boxId ||
        objectId == floorId ||
        objectId == seaId ||
        objectId == groundId)
    {
        vec3 T = normalize(tanVec);
        vec3 B = normalize(cross(T, N));
        vec3 delta = texture(normalMap, texCoord).xyz;
        delta = (delta * 2.0) - vec3(1.0f, 1.0f, 1.0f);
        N = delta.x * T + delta.y * B + delta.z * N;
        Kd = texture(textureMap, texCoord).xyz;
    }
    if (objectId == teapotId) {
        Kd = texture(textureMap, texCoord).xyz;
    }
    if (objectId == seaId) {
        vec3 R = -(2 * max(dot(V, N), 0.0001f) * N - V);
        vec2 uv = vec2(-atan(R.y, R.x) / (2 * 3.141592f), acos(R.z) / 3.141592f);
        
        FragColor = texture(textureMap, uv);
        return FragColor.xyz;
    }
    if (objectId == skyId) {
        vec2 uv = vec2(-atan(V.y, V.x) / (2 * 3.141592f), acos(V.z) / 3.141592f);
        FragColor = texture(textureMap, uv);
        return FragColor.xyz;
    }
    if (objectId == lPicId) {
        if ( ((int(texCoord.x / 0.9f * 7)) % 2) == ((int(texCoord.y / 0.9f * 7)) % 2) ) {
            return vec3(1.0f, 1.0f, 1.0f);
        }
        return vec3(0.0f, 0.0f, 0.0f);
    }
    if (objectId == rPicId) {
        if (texCoord.x < 0.05f || texCoord.x > 0.95f) {
            return vec3(0.5f, 0.5f, 0.5f);
        }
        if (texCoord.y < 0.05f || texCoord.y > 0.95f) {
            return vec3(0.5f, 0.5f, 0.5f);
        }
        
        FragColor = texture(textureMap, (texCoord - 0.05f) / 0.9f);
        return FragColor.xyz; 
    }

    // Values describing the scene's light
    vec3 Ii = lightVal;
    vec3 Ia = lightAmb;

    vec3 R = -(2 * max(dot(V, N), 0.0001f) * N - V);
    uv = vec2(-atan(R.y, R.x) / (2 * 3.141592f), acos(R.z) / 3.141592f);
    Ii = texture(skyMap, uv).xyz;

    // diffuse color from irradiance map
    Ia = cL * (Kd / 3.141592f);

    // Values for lighting calculation
    vec3 H = normalize(L + V);
    float LH = max(dot(L, H), 0.0001f);
    float LN = max(dot(L, N), 0.0001f);
    float HN = max(dot(H, N), 0.0001f);
    float VN = max(dot(V, N), 0.0001f);
    vec3 BRDF;

    // A checkerboard pattern to break up larte flat expanses.  Remove when using textures.
//    if (objectId==groundId || objectId==floorId || objectId==seaId) {
//        ivec2 uv = ivec2(floor(100.0*texCoord));
//        if ((uv[0]+uv[1])%2==0)
//            Kd *= 0.9; }
    
    // Schlick's approximation to Fresnel term F
    vec3 F = Ks + ((vec3(1, 1, 1) - Ks) * pow(1 - LH, 5));
    
    // GGX
    if (mode == 1) {
        // Calculating shininess parameter for GGX from shininess
        float alphaGsq = (2.0f / (alpha + 2.0f));

        // tan theta (H) and tan theta (V)
        float tanThetaHSq = (1.0f - (HN * HN)) / (HN * HN);
        float tanThetaVSq = (1.0f - (VN * VN)) / (VN * VN);
    
        // Self occluding and self shadowing (masking) geometry term G (L, V, H) = G1 (L, H) * G1 (V, H)
        float GLH = 1.0f;
        float GVH = 1.0f;
        if (tanThetaHSq <= 1) {
            GLH = 2.0f / (1.0f + sqrt(1 + (alphaGsq * tanThetaHSq)));
        }
        if (tanThetaVSq <= 1) {
            GVH = 2.0f / (1.0f + sqrt(1 + (alphaGsq * tanThetaVSq)));
        }
        float G = GLH * GVH;

        // Micro-facet normal distribution D in GGX
        float Dg = (alphaGsq * alphaGsq) / (3.141592f * pow(((pow(HN, 2.0f) * (alphaGsq - 1.0f)) + 1.0f), 2.0f));
    
        // Final Calculation - BRDF (GGX)
        BRDF = (Kd / 3.141592f) + ((F * G * Dg) / (4 * LN * VN));
    }
    // GGX End

    // Starter Set
    else {
        // Self occluding and self shadowing (masking) geometry term G and some denominator approximated
        float GandDen = pow(LH, -2.0f);

        // Micro-facet normal distribution D
        float D = pow(HN, alpha) * (alpha + 2) / (2 * 3.141592f);
    
        // Final Calculation - BRDF (Starter Set)
        BRDF = (Kd / 3.141592f) + (F * GandDen * D / 4);
    }
    // Starter Set End
  
    // Project interpolated pixel to shadow map
    vec2 shadowIndex = shadowCoord.xy/shadowCoord.w;

    float lightDepth = 0.0001f;
    float pixelDepth = 0.0001f;

    lightDepth = texture(shadowMap, shadowIndex).w;
    pixelDepth = shadowCoord.w;

    int notInShadow = 1;

    // If shadows are enabled
    if (shadows == 0) {
        // Check if shadowIndex is in range
        if (shadowCoord.w > 0  && shadowIndex.x > 0 && shadowIndex.x < 1 && shadowIndex.y > 0 && shadowIndex.y < 1 ) {
            // If pixel is in shadow, only ambient light
            if (pixelDepth > lightDepth + 0.001f) {
                notInShadow = 0;
            }
        }
    }

    // Final colour
    FragColor.xyz = Ia + (Ii * LN * BRDF * notInShadow);

    return FragColor.xyz;
    
//    // Debugging
//    vec2 uv = gl_FragCoord.xy/vec2(1024, 1024);
//    gl_FragColor = texture(shadowMap, uv);
}