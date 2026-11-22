import{mkdirSync as m,readdirSync as d,readFileSync as f,writeFileSync as w}from'fs';
const T=Buffer.from('ABFBBAYKCw///////////wkJCQkJCQkFCQkJBQkJCf8JCQn/////////////////ICQkIAD//////////////wUI//////////////////8EBAEE','base64');
function run(P,I){
const S=new Int32Array(256),C=new Int32Array(64),M=new Int32Array(256),O=new Uint8Array(65536);
let s=0,c=0,p=0,t=0,o=0,q=0;const n=P.length,z=x=>[O.subarray(0,o),x];
for(;;){
if(t===1e6||p<0||p>=n)return z(t===1e6?10:9);
const g=P[p],v=T[g];
if(g>83||v===255)return z(5);
const u=(v>>2)&3;
if(p+(v>>4)>=n)return z(9);
t++;p+=1+(v>>4);
if(s<u)return z(2);
if(s-u+(v&3)>256)return z(3);
switch(g){
case 0:return z(0);
case 1:S[s++]=(P[p-1]<<24)>>24;break;
case 2:S[s++]=P[p-4]|P[p-3]<<8|P[p-2]<<16|P[p-1]<<24;break;
case 3:s--;break;
case 4:S[s]=S[s-1];s++;break;
case 5:{const x=S[s-1];S[s-1]=S[s-2];S[s-2]=x;break;}
case 6:S[s]=S[s-2];s++;break;
case 7:{const a=S[s-3];S[s-3]=S[s-2];S[s-2]=S[s-1];S[s-1]=a;break;}
case 23:S[s-1]=-S[s-1]|0;break;
case 27:S[s-1]=~S[s-1];break;
case 48:case 49:case 50:{const r=((P[p-2]|P[p-1]<<8)<<16)>>16;if(g===48||(g===49?S[--s]===0:S[--s]!==0))p+=r;break;}
case 51:if(c===64)return z(7);C[c++]=p;p=P[p-2]|P[p-1]<<8;break;
case 52:if(c===0)return z(8);p=C[--c];break;
case 64:{const a=S[s-1];if(a<0||a>=256)return z(6);S[s-1]=M[a];break;}
case 65:{const a=S[s-1],y=S[s-2];if(a<0||a>=256)return z(6);s-=2;M[a]=y;break;}
case 80:{const b=Buffer.from(String(S[s-1]));if(o+b.length>65536)return z(11);s--;O.set(b,o);o+=b.length;break;}
case 81:if(o>65535)return z(11);O[o++]=S[--s]&255;break;
case 82:S[s++]=q<I.length?I[q++]:-1;break;
case 83:return z(S[--s]&255);
default:{
const b=S[s-1],a=S[s-2],A=a>>>0,B=b>>>0,k=b&31;
if(!b&&g>18&&g<23)return z(4);
const r=[a+b|0,a-b|0,Math.imul(a,b),(a/b)|0,a%b|0,A/B|0,A%B|0,0,a&b,a|b,a^b,0,a<<k,a>>k,a>>>k|0,0,a===b?1:0,a<b?1:0,A<B?1:0][g-16];
s-=2;S[s++]=r;
}
}
}
}
const e=process.env,A=e.MAKEFUN_INPUT_DIR??'/input',B=e.MAKEFUN_OUTPUT_DIR??'/output';
for(const id of d(A)){const a=A+'/'+id,b=B+'/'+id,[o,c]=run(f(a+'/program.bin'),f(a+'/input.bin'));m(b,{recursive:true});w(b+'/stdout.bin',o);w(b+'/exit.txt',c+'\n');}
