/////////////////////////////////////////////////////////////////////////
// Vertex shader for reflection (top)
//
// Copyright 2013 DigiPen Institute of Technology
////////////////////////////////////////////////////////////////////////
#version 330

uniform mat4 ModelTr;
uniform vec3 eyePos;
uniform int pass;

in vec4 vertex;
in vec3 vertexNormal;
in vec2 vertexTexture;
in vec3 vertexTangent;

void LightingVertex(vec3 eyePos);

void main()
{
    // Eye position is center of teapot

    vec4 WorldPoint = ModelTr*vertex;

    vec3 R = WorldPoint.xyz - eyePos;
    float a = R.x;
    float b = R.y;
    float c = R.z;

    float magR = sqrt((a * a) + (b * b) + (c * c));
    a = a / magR;
    b = b / magR;
    c = c / magR;

    if (pass == 1) {
        gl_Position = vec4((a / (1 + c)), (b / (1 + c)), ((c * magR / 1000.0f) - 1), 1);
    }
    else {
        gl_Position = vec4((a / (1 - c)), (b / (1 - c)), ((-c * magR / 1000.0f) - 1), 1);
    }

    LightingVertex(eyePos);
}
