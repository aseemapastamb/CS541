/////////////////////////////////////////////////////////////////////////
// Pixel shader for reflection (top)
////////////////////////////////////////////////////////////////////////
#version 330

vec3 LightingPixel();

void main()
{
	gl_FragColor.xyz = LightingPixel();
}
