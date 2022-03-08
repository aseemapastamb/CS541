/////////////////////////////////////////////////////////////////////////
// Vertex shader for lighting
//
// Copyright 2013 DigiPen Institute of Technology
////////////////////////////////////////////////////////////////////////
#version 330

uniform mat4 WorldView, WorldInverse, WorldProj, ModelTr, NormalTr, ShadowMatrix, TextureTr;

in vec4 vertex;
in vec3 vertexNormal;
in vec2 vertexTexture;
in vec3 vertexTangent;

out vec3 tanVec;
out vec3 normalVec;
out vec3 eyeVec;
out vec3 lightVec;
out vec2 texCoord;
out vec4 shadowCoord;
uniform vec3 lightPos;
uniform vec3 lightVal;
uniform vec3 lightAmb;

void LightingVertex(vec3 eyePos) {
    // Compute the world pos at a pixel used for light and eye vector calculations
    vec3 worldPos = (ModelTr*vertex).xyz;
    
    // Compute normal vector and output to fragment shader
    normalVec = vertexNormal*mat3(NormalTr);

    // Compute tangent vector
    tanVec = mat3(ModelTr) * vertexTangent;
    
    // Compute vectors toward light and eye and output to fragment shader
    lightVec = lightPos - worldPos;
    eyeVec = eyePos - worldPos;

    texCoord = (TextureTr * vec4(vertexTexture, 0.0f, 0.0f)).xy;
    
    // Compute vector position in light's POV and output to fragment shader
    shadowCoord = ShadowMatrix * ModelTr * vertex;
}