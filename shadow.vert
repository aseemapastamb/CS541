/////////////////////////////////////////////////////////////////////////
// Vertex shader for lighting
//
// Copyright 2013 DigiPen Institute of Technology
////////////////////////////////////////////////////////////////////////
#version 330

uniform mat4 WorldView, WorldProj, ModelTr;

in vec4 vertex;

out vec4 position;

void main()
{
    // Compute the point's projection on the screen
    gl_Position = WorldProj*WorldView*ModelTr*vertex;

    // Vertex depth from light's POV
    position = gl_Position;
}
