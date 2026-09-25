/* ============================================================
   CHAD'S RANGE ROVER — tiny WebGL engine (no libraries)
   Flat-shaded low-poly renderer with fog + snow particles.
   ============================================================ */
'use strict';

/* ---------------- math ---------------- */
function mat4() { return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]); }

function m4perspective(out, fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
  out[0]=f/aspect; out[1]=0; out[2]=0; out[3]=0;
  out[4]=0; out[5]=f; out[6]=0; out[7]=0;
  out[8]=0; out[9]=0; out[10]=(far+near)*nf; out[11]=-1;
  out[12]=0; out[13]=0; out[14]=2*far*near*nf; out[15]=0;
  return out;
}

function m4lookAt(out, ex,ey,ez, cx,cy,cz, ux,uy,uz) {
  let z0=ex-cx, z1=ey-cy, z2=ez-cz;
  let len = Math.hypot(z0,z1,z2) || 1; z0/=len; z1/=len; z2/=len;
  let x0 = uy*z2 - uz*z1, x1 = uz*z0 - ux*z2, x2 = ux*z1 - uy*z0;
  len = Math.hypot(x0,x1,x2);
  if (!len) { x0=1; x1=0; x2=0; } else { x0/=len; x1/=len; x2/=len; }
  const y0 = z1*x2 - z2*x1, y1 = z2*x0 - z0*x2, y2 = z0*x1 - z1*x0;
  out[0]=x0; out[1]=y0; out[2]=z0; out[3]=0;
  out[4]=x1; out[5]=y1; out[6]=z1; out[7]=0;
  out[8]=x2; out[9]=y2; out[10]=z2; out[11]=0;
  out[12]=-(x0*ex + x1*ey + x2*ez);
  out[13]=-(y0*ex + y1*ey + y2*ez);
  out[14]=-(z0*ex + z1*ey + z2*ez);
  out[15]=1;
  return out;
}

/* rotation-only normal matrix (mat3) + full model matrix, R = Ry * Rx * Rz */
function composeTR(outM4, outM3, x,y,z, rx,ry,rz) {
  const cx=Math.cos(rx), sx=Math.sin(rx);
  const cy=Math.cos(ry), sy=Math.sin(ry);
  const cz=Math.cos(rz), sz=Math.sin(rz);
  // Ry * Rx
  const a00=cy,       a01=sy*sx,     a02=sy*cx;
  const a10=0,        a11=cx,        a12=-sx;
  const a20=-sy,      a21=cy*sx,     a22=cy*cx;
  // (Ry*Rx) * Rz
  const m00=a00*cz + a01*sz, m01=-a00*sz + a01*cz, m02=a02;
  const m10=a10*cz + a11*sz, m11=-a10*sz + a11*cz, m12=a12;
  const m20=a20*cz + a21*sz, m21=-a20*sz + a21*cz, m22=a22;
  outM4[0]=m00; outM4[1]=m10; outM4[2]=m20; outM4[3]=0;
  outM4[4]=m01; outM4[5]=m11; outM4[6]=m21; outM4[7]=0;
  outM4[8]=m02; outM4[9]=m12; outM4[10]=m22; outM4[11]=0;
  outM4[12]=x; outM4[13]=y; outM4[14]=z; outM4[15]=1;
  outM3[0]=m00; outM3[1]=m10; outM3[2]=m20;
  outM3[3]=m01; outM3[4]=m11; outM3[5]=m21;
  outM3[6]=m02; outM3[7]=m12; outM3[8]=m22;
}

function hex(c) {
  return [((c>>16)&255)/255, ((c>>8)&255)/255, (c&255)/255];
}

/* ---------------- geometry builder ---------------- */
function Builder() { this.p = []; this.n = []; this.c = []; }

Builder.prototype.tri = function (a, b, c, col) {
  const ux=b[0]-a[0], uy=b[1]-a[1], uz=b[2]-a[2];
  const vx=c[0]-a[0], vy=c[1]-a[1], vz=c[2]-a[2];
  let nx=uy*vz-uz*vy, ny=uz*vx-ux*vz, nz=ux*vy-uy*vx;
  const l = Math.hypot(nx,ny,nz) || 1; nx/=l; ny/=l; nz/=l;
  const P=this.p, N=this.n, C=this.c;
  const pts=[a,b,c];
  for (let i=0;i<3;i++){
    P.push(pts[i][0],pts[i][1],pts[i][2]);
    N.push(nx,ny,nz);
    C.push(col[0],col[1],col[2]);
  }
  return this;
};

Builder.prototype.quad = function (a,b,c,d,col) { this.tri(a,b,c,col); this.tri(a,c,d,col); return this; };

Builder.prototype.box = function (cx,cy,cz, w,h,d, color, shade) {
  const col = typeof color === 'number' ? hex(color) : color;
  shade = shade === undefined ? 1 : shade;
  const s = [col[0]*shade, col[1]*shade, col[2]*shade];
  const x0=cx-w/2, x1=cx+w/2, y0=cy-h/2, y1=cy+h/2, z0=cz-d/2, z1=cz+d/2;
  const p = [
    [x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],
    [x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]
  ];
  this.quad(p[4],p[5],p[6],p[7], s);            // +Z
  this.quad(p[1],p[0],p[3],p[2], s);            // -Z
  this.quad(p[5],p[1],p[2],p[6], s);            // +X
  this.quad(p[0],p[4],p[7],p[3], s);            // -X
  this.quad(p[3],p[7],p[6],p[2], s);            // +Y
  this.quad(p[0],p[1],p[5],p[4], s);            // -Y
  return this;
};

/* axis: 0=x, 1=y, 2=z */
Builder.prototype.cyl = function (cx,cy,cz, r, len, seg, color, axis) {
  const col = typeof color === 'number' ? hex(color) : color;
  seg = seg || 12; axis = axis === undefined ? 1 : axis;
  const map = (u, v, w) => {           // u,v = circle plane, w = along axis
    if (axis === 0) return [cx + w, cy + u, cz + v];
    if (axis === 2) return [cx + u, cy + v, cz + w];
    return [cx + u, cy + w, cz + v];
  };
  const h0 = -len/2, h1 = len/2;
  for (let i=0;i<seg;i++){
    const a0 = (i/seg)*Math.PI*2, a1 = ((i+1)/seg)*Math.PI*2;
    const c0=Math.cos(a0)*r, s0=Math.sin(a0)*r, c1=Math.cos(a1)*r, s1=Math.sin(a1)*r;
    this.quad(map(c0,s0,h0), map(c1,s1,h0), map(c1,s1,h1), map(c0,s0,h1), col);
    this.tri(map(0,0,h1), map(c0,s0,h1), map(c1,s1,h1), col);
    this.tri(map(0,0,h0), map(c1,s1,h0), map(c0,s0,h0), col);
  }
  return this;
};

Builder.prototype.cone = function (cx,cy,cz, r, h, seg, color) {
  const col = typeof color === 'number' ? hex(color) : color;
  seg = seg || 10;
  for (let i=0;i<seg;i++){
    const a0=(i/seg)*Math.PI*2, a1=((i+1)/seg)*Math.PI*2;
    const p0=[cx+Math.cos(a0)*r, cy, cz+Math.sin(a0)*r];
    const p1=[cx+Math.cos(a1)*r, cy, cz+Math.sin(a1)*r];
    this.tri(p0, p1, [cx, cy+h, cz], col);
    this.tri([cx,cy,cz], p1, p0, col);
  }
  return this;
};

Builder.prototype.sphere = function (cx,cy,cz, r, seg, color) {
  const col = typeof color === 'number' ? hex(color) : color;
  seg = seg || 8;
  const rings = Math.max(4, Math.round(seg/1.5));
  for (let i=0;i<rings;i++){
    const t0 = (i/rings)*Math.PI, t1 = ((i+1)/rings)*Math.PI;
    for (let j=0;j<seg;j++){
      const p0=(j/seg)*Math.PI*2, p1=((j+1)/seg)*Math.PI*2;
      const v=(t,p)=>[cx+r*Math.sin(t)*Math.cos(p), cy+r*Math.cos(t), cz+r*Math.sin(t)*Math.sin(p)];
      this.quad(v(t0,p0), v(t1,p0), v(t1,p1), v(t0,p1), col);
    }
  }
  return this;
};

/* ---------------- engine ---------------- */
const E = {
  gl: null, canvas: null, prog: null, sky: null, pts: null,
  proj: mat4(), view: mat4(), model: mat4(), nrm: new Float32Array(9),
  W: 1, H: 1, fogColor: [0.72, 0.85, 0.96]
};

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}
function program(gl, vs, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  return p;
}

E.init = function (canvas) {
  const gl = canvas.getContext('webgl', { antialias: true, alpha: false, powerPreference: 'high-performance' })
          || canvas.getContext('experimental-webgl');
  if (!gl) throw new Error('no webgl');
  E.gl = gl; E.canvas = canvas;

  const VS = `
    attribute vec3 aPos; attribute vec3 aNorm; attribute vec3 aCol;
    uniform mat4 uProj, uView, uModel; uniform mat3 uNrm;
    varying vec3 vN; varying vec3 vC; varying float vFog; varying float vY;
    void main(){
      vec4 wp = uModel * vec4(aPos,1.0);
      vec4 vp = uView * wp;
      gl_Position = uProj * vp;
      vN = normalize(uNrm * aNorm);
      vC = aCol; vY = wp.y;
      vFog = clamp((-vp.z - 40.0) / 215.0, 0.0, 1.0) * 0.94;
    }`;
  const FS = `
    precision mediump float;
    varying vec3 vN; varying vec3 vC; varying float vFog; varying float vY;
    uniform vec3 uFog; uniform float uTint; uniform vec3 uTintCol; uniform float uGray;
    void main(){
      vec3 L = normalize(vec3(0.45, 0.85, 0.35));
      float d = max(dot(vN, L), 0.0);
      float sky = 0.5 + 0.5 * vN.y;
      vec3 c = vC * (0.42 + 0.62*d + 0.16*sky);
      c = mix(c, uTintCol, uTint);
      float g = dot(c, vec3(0.299,0.587,0.114));
      c = mix(c, vec3(g), uGray);
      c = mix(c, uFog, vFog);
      gl_FragColor = vec4(c, 1.0);
    }`;
  const p = program(gl, VS, FS);
  E.prog = {
    id: p,
    aPos: gl.getAttribLocation(p,'aPos'),
    aNorm: gl.getAttribLocation(p,'aNorm'),
    aCol: gl.getAttribLocation(p,'aCol'),
    uProj: gl.getUniformLocation(p,'uProj'),
    uView: gl.getUniformLocation(p,'uView'),
    uModel: gl.getUniformLocation(p,'uModel'),
    uNrm: gl.getUniformLocation(p,'uNrm'),
    uFog: gl.getUniformLocation(p,'uFog'),
    uTint: gl.getUniformLocation(p,'uTint'),
    uTintCol: gl.getUniformLocation(p,'uTintCol'),
    uGray: gl.getUniformLocation(p,'uGray')
  };

  // sky gradient quad
  const SVS = `attribute vec2 aP; varying float vY; void main(){ vY = aP.y*0.5+0.5; gl_Position=vec4(aP,0.999,1.0);} `;
  const SFS = `precision mediump float; varying float vY; uniform vec3 uTop, uBot; uniform float uGray;
    void main(){ vec3 c = mix(uBot, uTop, pow(vY, 0.85));
      float g = dot(c, vec3(0.299,0.587,0.114)); c = mix(c, vec3(g), uGray);
      gl_FragColor=vec4(c,1.0);} `;
  const sp = program(gl, SVS, SFS);
  const sb = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sb);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  E.sky = { id: sp, buf: sb, aP: gl.getAttribLocation(sp,'aP'),
            uTop: gl.getUniformLocation(sp,'uTop'), uBot: gl.getUniformLocation(sp,'uBot'),
            uGray: gl.getUniformLocation(sp,'uGray') };

  // particles (snow / smoke / sparks)
  const PVS = `attribute vec3 aP; attribute vec4 aC; uniform mat4 uProj, uView; uniform float uScale;
    varying vec4 vC; void main(){ vec4 vp = uView*vec4(aP,1.0); gl_Position = uProj*vp;
      gl_PointSize = clamp(uScale * aC.a * 40.0 / max(-vp.z, 1.0), 1.0, 60.0); vC = aC; }`;
  const PFS = `precision mediump float; varying vec4 vC;
    void main(){ vec2 d = gl_PointCoord - vec2(0.5); float r = length(d);
      if (r > 0.5) discard; gl_FragColor = vec4(vC.rgb, (1.0 - r*1.8)); }`;
  const pp = program(gl, PVS, PFS);
  E.pts = { id: pp, buf: gl.createBuffer(), cbuf: gl.createBuffer(),
            aP: gl.getAttribLocation(pp,'aP'), aC: gl.getAttribLocation(pp,'aC'),
            uProj: gl.getUniformLocation(pp,'uProj'), uView: gl.getUniformLocation(pp,'uView'),
            uScale: gl.getUniformLocation(pp,'uScale') };

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);
  return E;
};

E.resize = function (w, h, dpr) {
  const c = E.canvas;
  c.width = Math.floor(w * dpr); c.height = Math.floor(h * dpr);
  c.style.width = w + 'px'; c.style.height = h + 'px';
  E.W = c.width; E.H = c.height;
  E.gl.viewport(0, 0, E.W, E.H);
  m4perspective(E.proj, 62 * Math.PI/180, w/h, 0.3, 400);
};

/* A Mesh = one static VBO built from a Builder */
function Mesh(b) {
  const gl = E.gl;
  this.count = b.p.length / 3;
  this.buf = gl.createBuffer();
  const inter = new Float32Array(this.count * 9);
  for (let i=0;i<this.count;i++){
    inter[i*9+0]=b.p[i*3]; inter[i*9+1]=b.p[i*3+1]; inter[i*9+2]=b.p[i*3+2];
    inter[i*9+3]=b.n[i*3]; inter[i*9+4]=b.n[i*3+1]; inter[i*9+5]=b.n[i*3+2];
    inter[i*9+6]=b.c[i*3]; inter[i*9+7]=b.c[i*3+1]; inter[i*9+8]=b.c[i*3+2];
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
  gl.bufferData(gl.ARRAY_BUFFER, inter, gl.STATIC_DRAW);
}

E.beginFrame = function (skyTop, skyBot, gray) {
  const gl = E.gl;
  gl.depthMask(true);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.disable(gl.DEPTH_TEST);
  gl.depthMask(false);
  gl.useProgram(E.sky.id);
  gl.bindBuffer(gl.ARRAY_BUFFER, E.sky.buf);
  gl.enableVertexAttribArray(E.sky.aP);
  gl.vertexAttribPointer(E.sky.aP, 2, gl.FLOAT, false, 0, 0);
  gl.uniform3fv(E.sky.uTop, skyTop);
  gl.uniform3fv(E.sky.uBot, skyBot);
  gl.uniform1f(E.sky.uGray, gray);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.depthMask(true);
  gl.enable(gl.DEPTH_TEST);
  gl.disableVertexAttribArray(E.sky.aP);

  const P = E.prog;
  gl.useProgram(P.id);
  gl.enableVertexAttribArray(P.aPos);
  gl.enableVertexAttribArray(P.aNorm);
  gl.enableVertexAttribArray(P.aCol);
  gl.uniformMatrix4fv(P.uProj, false, E.proj);
  gl.uniformMatrix4fv(P.uView, false, E.view);
  gl.uniform3fv(P.uFog, E.fogColor);
  gl.uniform1f(P.uGray, gray);
  gl.uniform1f(P.uTint, 0);
  gl.uniform3f(P.uTintCol, 1, 0, 0);
};

E.draw = function (mesh, x,y,z, rx,ry,rz, tint) {
  if (!mesh) return;
  const gl = E.gl, P = E.prog;
  composeTR(E.model, E.nrm, x,y,z, rx||0, ry||0, rz||0);
  gl.uniformMatrix4fv(P.uModel, false, E.model);
  gl.uniformMatrix3fv(P.uNrm, false, E.nrm);
  gl.uniform1f(P.uTint, tint || 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buf);
  const st = 36;
  gl.vertexAttribPointer(P.aPos, 3, gl.FLOAT, false, st, 0);
  gl.vertexAttribPointer(P.aNorm, 3, gl.FLOAT, false, st, 12);
  gl.vertexAttribPointer(P.aCol, 3, gl.FLOAT, false, st, 24);
  gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
};

/* particle batch: arr = Float32Array xyz, col = Float32Array rgba */
E.drawPoints = function (posArr, colArr, n, scale) {
  if (!n) return;
  const gl = E.gl, P = E.pts;
  gl.useProgram(P.id);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.depthMask(false);
  gl.bindBuffer(gl.ARRAY_BUFFER, P.buf);
  gl.bufferData(gl.ARRAY_BUFFER, posArr, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(P.aP);
  gl.vertexAttribPointer(P.aP, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, P.cbuf);
  gl.bufferData(gl.ARRAY_BUFFER, colArr, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(P.aC);
  gl.vertexAttribPointer(P.aC, 4, gl.FLOAT, false, 0, 0);
  gl.uniformMatrix4fv(P.uProj, false, E.proj);
  gl.uniformMatrix4fv(P.uView, false, E.view);
  gl.uniform1f(P.uScale, scale || 1);
  gl.drawArrays(gl.POINTS, 0, n);
  gl.depthMask(true);
  gl.disable(gl.BLEND);
  gl.disableVertexAttribArray(P.aP);
  gl.disableVertexAttribArray(P.aC);
  gl.useProgram(E.prog.id);
};
