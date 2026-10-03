const fs=require('fs');
const path=require('path');
const sharp=require('sharp');

const source=path.resolve(__dirname,'../assets/media/artist-gallery');
const output=path.join(source,'optimized');
fs.mkdirSync(output,{recursive:true});

for(const filename of fs.readdirSync(source)){
  const input=path.join(source,filename);
  if(!fs.statSync(input).isFile()||!(/\.(jpe?g|png)$/i.test(filename)))continue;
  const destination=path.join(output,`${path.parse(filename).name}.webp`);
  sharp(input)
    .rotate()
    .resize({width:768,height:768,fit:'inside',withoutEnlargement:true})
    .webp({quality:78,effort:6})
    .toFile(destination)
    .then(()=>console.log(path.basename(destination)));
}
