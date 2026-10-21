/* QR Model 2, version 1-L, byte mode, mask 0. Short ASCII sample identifiers only. */
window.VPQR=function(value){
 const size=21,m=Array.from({length:size},()=>Array(size).fill(null)),bytes=Array.from(value,c=>c.charCodeAt(0));if(bytes.length>17||bytes.some(c=>c>127))throw Error('QR sample payload too long');
 const bits=[];const put=(v,n)=>{for(let i=n-1;i>=0;i--)bits.push((v>>>i)&1)};put(4,4);put(bytes.length,8);bytes.forEach(c=>put(c,8));put(0,Math.min(4,152-bits.length));while(bits.length%8)bits.push(0);const data=[];for(let i=0;i<bits.length;i+=8)data.push(bits.slice(i,i+8).reduce((a,b)=>a*2+b,0));for(let i=0;data.length<19;i++)data.push(i%2?17:236);
 const mul=(a,b)=>{let z=0;while(b){if(b&1)z^=a;b>>=1;a<<=1;if(a&256)a^=285;}return z};let gen=[1],root=1;for(let i=0;i<7;i++){let next=Array(gen.length+1).fill(0);gen.forEach((c,j)=>{next[j]^=c;next[j+1]^=mul(c,root)});gen=next;root=mul(root,2)}let rem=Array(7).fill(0);for(const d of data){const factor=d^rem.shift();rem.push(0);for(let j=0;j<7;j++)rem[j]^=mul(gen[j+1],factor)}
 const finder=(row,col)=>{for(let y=-1;y<=7;y++)for(let x=-1;x<=7;x++){let yy=row+y,xx=col+x;if(yy>=0&&yy<size&&xx>=0&&xx<size)m[yy][xx]=(x>=0&&x<=6&&y>=0&&y<=6&&(x===0||x===6||y===0||y===6||(x>=2&&x<=4&&y>=2&&y<=4)));}};finder(0,0);finder(0,14);finder(14,0);for(let i=8;i<13;i++)m[i][6]=m[6][i]=i%2===0;
 const format=0x77c4;for(let i=0;i<15;i++){const bit=!!((format>>>i)&1);m[i<6?i:i<8?i+1:size-15+i][8]=bit;m[8][i<8?size-i-1:i<9?7:14-i]=bit;}m[13][8]=true;
 let stream=[];for(const d of data.concat(rem))for(let b=7;b>=0;b--)stream.push((d>>>b)&1);let k=0,up=true;for(let right=20;right>=1;right-=2){if(right===6)right--;for(let v=0;v<size;v++){const y=up?20-v:v;for(let j=0;j<2;j++){const x=right-j;if(m[y][x]===null)m[y][x]=!!((stream[k++]||0)^((x+y)%2===0?1:0));}}up=!up;}
 let d='';for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(m[y][x])d+=`M${x+4} ${y+4}h1v1h-1z`;
 return `<svg class="v5-qr" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 29 29" role="img" aria-label="QR: ${value}"><rect width="29" height="29" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
};
