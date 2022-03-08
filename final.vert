/////////////////////////////////////////////////////////////////////////
// Vertex shader for lighting
//
// Copyright 2013 DigiPen Institute of Technology
////////////////////////////////////////////////////////////////////////
#version 330

uniform mat4 WorldView, WorldInverse, WorldProj, ModelTr;

in vec4 vertex;

void LightingVertex(vec3 eyePos);

void main()
{
    // Compute the point's projection on the screen
    gl_Position = WorldProj*WorldView*ModelTr*vertex;

    // Compute eye vectors
    vec3 eyePos = (WorldInverse * vec4(0, 0, 0, 1)).xyz;

    LightingVertex(eyePos);
}
