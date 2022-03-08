/////////////////////////////////////////////////////////////////////////
// Pixel shader for lighting
////////////////////////////////////////////////////////////////////////
#version 330
uniform bool Reflective;
uniform sampler2D reflectionMapTop;
uniform sampler2D reflectionMapBottom;
uniform vec3 diffuse;
uniform vec3 specular;
uniform float shininess;

in vec3 normalVec;
in vec3 eyeVec;
in vec2 texCoord;

vec3 reflectionColor;

vec3 LightingPixel();

void main()
{
    float exposure = 1.5f;
    float contrast = 1.1f;

    // Reflection
    if (Reflective) {
        // Values for lighting calculation
        vec3 N = normalize(normalVec);
        vec3 V = normalize(eyeVec);
        float VN = max(dot(V, N), 0.0001f);

        vec3 R = 2 * VN * N - V;
        float a = R.x;
        float b = R.y;
        float c = R.z;

        float magR = sqrt((a * a) + (b * b) + (c * c));
        a = a / magR;
        b = b / magR;
        c = c / magR;

        if (c > 0) {
            vec2 uv = (vec2(a / (1 + c), b / (1 + c)) * 0.5f) + vec2(0.5f, 0.5f);
            reflectionColor = texture(reflectionMapTop, uv).xyz;
        }
        else {
            vec2 uv = (vec2(a / (1 - c), b / (1 - c)) * 0.5f) + vec2(0.5f, 0.5f);
            reflectionColor = texture(reflectionMapBottom, uv).xyz;
        }
        
        // Values for lighting calculation
        float NL = max(dot(R, N), 0.0001f);
        vec3 H = normalize(R + V);
        float LH = max(dot(R, H), 0.0001f);
        float HN = max(dot(H, N), 0.0001f);

        // Schlick's approximation to Fresnel term F
        vec3 F = specular + ((vec3(1, 1, 1) - specular) * pow(1 - LH, 5));
        
        // Self occluding and self shadowing (masking) geometry term G and some denominator approximated
        float GandDen = pow(LH, -2.0f);

        // Micro-facet normal distribution D
        float D = pow(HN, shininess) * (shininess + 2) / (2 * 3.141592f);
    
        // Final Calculation - BRDF (Starter Set)
        vec3 BRDF = (diffuse / 3.141592f) + (F * GandDen * D / 4);
        
        // linear to gamma
        vec3 cL = LightingPixel();
        cL = (cL * exposure) / ((cL * exposure) + vec3(1, 1, 1));
        vec3 cG = vec3(pow(cL.x, contrast / 2.2f), pow(cL.y, contrast / 2.2f), pow(cL.z, contrast / 2.2f));

        // Reflected light as specular
//        gl_FragColor.xyz = LightingPixel() + (reflectionColor * NL * BRDF);
        gl_FragColor.xyz = cG + (reflectionColor * NL * BRDF);

        // Simple combination
        //gl_FragColor.xyz = LightingPixel() + (reflectionColor * 0.2f);
    }
    else {
        // linear to gamma
        vec3 cL = LightingPixel();
        cL = (cL * exposure) / ((cL * exposure) + vec3(1, 1, 1));
        vec3 cG = vec3(pow(cL.x, contrast / 2.2f), pow(cL.y, contrast / 2.2f), pow(cL.z, contrast / 2.2f));

//        gl_FragColor.xyz = LightingPixel();
        gl_FragColor.xyz = cG;
    }
}
