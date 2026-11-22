// Tiny stack VM (ISA v1), written from the kit's ISA.md. One run answers every
// instance in /input, writing /output/<id>/stdout.bin and /output/<id>/exit.txt.
// Traps are thrown as their exit code and caught per instance; the output
// written before a trap is kept. Node 22 runs this TS as-is (erasable syntax).
import{mkdirSync,readdirSync,readFileSync,statSync,writeFileSync}from'node:fs';
import{join}from'node:path';
const I=process.env.MAKEFUN_INPUT_DIR??'/input',O=process.env.MAKEFUN_OUTPUT_DIR??'/output';
// Binary ops (0x10-0x16,0x18-0x1a,0x1c-0x1e,0x20-0x22): same stack shape,
// (a b -- r) with b on top. Division traps 4 on a zero divisor.
const B:Record<number,(a:number,b:number)=>number>={
16:(a,b)=>(a+b)|0,17:(a,b)=>(a-b)|0,18:Math.imul,
19:(a,b)=>{if(!b)throw 4;return(a/b)|0},
20:(a,b)=>{if(!b)throw 4;return a%b},
21:(a,b)=>{if(!b)throw 4;return Math.trunc((a>>>0)/(b>>>0))|0},
22:(a,b)=>{if(!b)throw 4;return((a>>>0)%(b>>>0))|0},
24:(a,b)=>a&b,25:(a,b)=>a|b,26:(a,b)=>a^b,
28:(a,b)=>a<<(b&31),29:(a,b)=>a>>(b&31),30:(a,b)=>(a>>>(b&31))|0,
32:(a,b)=>a===b?1:0,33:(a,b)=>a<b?1:0,34:(a,b)=>(a>>>0)<(b>>>0)?1:0};
// Scratch digits for PRINT's manual decimal conversion (no string per print).
const D=new Uint8Array(11);
function run(p:Uint8Array,n:Uint8Array):{o:Uint8Array,c:number}{
const s=new Int32Array(256),m=new Int32Array(256),k=new Int32Array(64),u=new Uint8Array(65536);
let sp=0,cp=0,pc=0,ip=0,ol=0,t=0;
try{for(;;){
if(t>=1e6)throw 10; // step limit
if(pc<0||pc>=p.length)throw 9; // pc outside the program
const o=p[pc];t++;
const f=B[o];
if(f){if(sp<2)throw 2;const b=s[--sp];s[sp-1]=f(s[sp-1],b);pc++;continue;}
switch(o){
case 0:return{o:u.subarray(0,ol),c:0}; // HALT
case 1: // PUSH8: signed byte, sign-extended.
if(pc+1>=p.length)throw 9;{let v=p[pc+1];if(v>127)v-=256;if(sp>255)throw 3;s[sp++]=v;}pc+=2;break;
case 2: // PUSH32: signed 32-bit, little-endian.
if(pc+4>=p.length)throw 9;if(sp>255)throw 3;s[sp++]=p[pc+1]|p[pc+2]<<8|p[pc+3]<<16|p[pc+4]<<24;pc+=5;break;
case 3:if(!sp)throw 2;sp--;pc++;break; // POP
case 4:if(!sp)throw 2;if(sp>255)throw 3;s[sp]=s[sp-1];sp++;pc++;break; // DUP
case 5:if(sp<2)throw 2;{const a=s[sp-1];s[sp-1]=s[sp-2];s[sp-2]=a;}pc++;break; // SWAP
case 6:if(sp<2)throw 2;if(sp>255)throw 3;s[sp]=s[sp-2];sp++;pc++;break; // OVER
case 7:if(sp<3)throw 2;{const a=s[sp-3];s[sp-3]=s[sp-2];s[sp-2]=s[sp-1];s[sp-1]=a;}pc++;break; // ROT
case 23:if(!sp)throw 2;s[sp-1]=-s[sp-1]|0;pc++;break; // NEG
case 27:if(!sp)throw 2;s[sp-1]=~s[sp-1];pc++;break; // NOT
case 48: // JMP: next instruction + signed 16-bit offset.
if(pc+2>=p.length)throw 9;{let d=p[pc+1]|p[pc+2]<<8;if(d>32767)d-=65536;pc+=3+d;}break;
case 49: // JZ
if(pc+2>=p.length)throw 9;if(!sp)throw 2;{const v=s[--sp];let d=p[pc+1]|p[pc+2]<<8;if(d>32767)d-=65536;pc+=3+(v?0:d);}break;
case 50: // JNZ
if(pc+2>=p.length)throw 9;if(!sp)throw 2;{const v=s[--sp];let d=p[pc+1]|p[pc+2]<<8;if(d>32767)d-=65536;pc+=3+(v?d:0);}break;
case 51: // CALL: unsigned 16-bit target; 64 held returns trap 7.
if(pc+2>=p.length)throw 9;if(cp>63)throw 7;k[cp++]=pc+3;pc=p[pc+1]|p[pc+2]<<8;break;
case 52:if(!cp)throw 8;pc=k[--cp];break; // RET
case 64:if(!sp)throw 2;{const a=s[sp-1];if(a<0||a>255)throw 6;s[sp-1]=m[a];}pc++;break; // LOAD
case 65:if(sp<2)throw 2;{const a=s[--sp],v=s[--sp];if(a<0||a>255)throw 6;m[a]=v;}pc++;break; // STORE
case 80: // PRINT: decimal ASCII, no newline; past 65536 bytes traps 11.
if(!sp)throw 2;{let v=s[--sp];const g=v<0;let x=g?-v:v,n=0;if(!x)D[n++]=48;else while(x>0){D[n++]=48+x%10;x=Math.trunc(x/10);}const l=n+(g?1:0);if(ol+l>65536)throw 11;if(g)u[ol++]=45;while(n--)u[ol++]=D[n];}pc++;break;
case 81:if(!sp)throw 2;if(ol>65535)throw 11;u[ol++]=s[--sp]&255;pc++;break; // PUTC
case 82:if(sp>255)throw 3;s[sp++]=ip<n.length?n[ip++]:-1;pc++;break; // IN
case 83:if(!sp)throw 2;return{o:u.subarray(0,ol),c:s[--sp]&255}; // EXIT
default:throw 5; // unknown opcode
}}}catch(e){if(typeof e=='number')return{o:u.subarray(0,ol),c:e};throw e;}}
for(const id of readdirSync(I).sort()){
const d=join(I,id);let q;try{q=statSync(d)}catch{continue}
if(!q.isDirectory())continue;
let a:{o:Uint8Array,c:number};
try{a=run(new Uint8Array(readFileSync(join(d,'program.bin'))),new Uint8Array(readFileSync(join(d,'input.bin'))))}catch{a={o:new Uint8Array(0),c:0}}
const e=join(O,id);mkdirSync(e,{recursive:true});
writeFileSync(join(e,'stdout.bin'),a.o);
writeFileSync(join(e,'exit.txt'),a.c+'\n');
}
