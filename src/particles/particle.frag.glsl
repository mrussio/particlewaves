precision highp float;

uniform vec3 uColorA;
uniform vec3 uColorB;
varying float vMix;

void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r = length(d);
  if (r > 0.5) discard;
  float alpha = smoothstep(0.5, 0.0, r);
  alpha = pow(alpha, 1.6);
  vec3 col = mix(uColorA, uColorB, vMix);
  gl_FragColor = vec4(col * alpha, alpha);
}
