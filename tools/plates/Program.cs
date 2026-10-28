using System;using System.IO;using System.Linq;using System.Text;using System.Collections.Generic;using CodeWalker.GameFiles;using CodeWalker.Utils;
class P{
 static void Main(string[] a){
  // a[0]=src vehshare.ytd ("-" = only new textures), a[1]=out dir, a[2..]=dds files to inject
  var outDir=a[1];Directory.CreateDirectory(outDir);
  var list=new List<Texture>();
  if(a[0]!="-"){var y0=new YtdFile();y0.Load(File.ReadAllBytes(a[0]));foreach(var t in y0.TextureDict.Textures.data_items)list.Add(t);Console.WriteLine("src textures "+list.Count);}
  for(int i=2;i<a.Length;i++){var t=DDSIO.GetTexture(File.ReadAllBytes(a[i]));t.Name=Path.GetFileNameWithoutExtension(a[i]).ToLowerInvariant();t.NameHash=JenkHash.GenHash(t.Name);
   var old=list.FindIndex(x=>x.NameHash==t.NameHash);if(old>=0){Console.WriteLine("replace "+t.Name+" "+list[old].Width+"x"+list[old].Height+" "+list[old].Format);list[old]=t;}else{Console.WriteLine("add "+t.Name);list.Add(t);}}
  var txd=new TextureDictionary();txd.BuildFromTextureList(list);
  var y=new YtdFile();y.TextureDict=txd;var ytd=y.Save();
  var y2=new YtdFile();y2.Load(ytd);Console.WriteLine("check reload: "+y2.TextureDict.Textures.data_items.Length+" textures");
  Directory.SetCurrentDirectory(outDir);
  var fn="\\dlc.rpf";if(File.Exists(fn))File.Delete(fn);
  var rpf=RpfFile.CreateNew("","dlc.rpf");
  RpfFile.CreateFile(rpf.Root,"setup2.xml",Encoding.UTF8.GetBytes(File.ReadAllText(Path.Combine(AppContext.BaseDirectory,"setup2.xml"))));
  RpfFile.CreateFile(rpf.Root,"content.xml",Encoding.UTF8.GetBytes(File.ReadAllText(Path.Combine(AppContext.BaseDirectory,"content.xml"))));
  var x64=RpfFile.CreateDirectory(RpfFile.CreateDirectory(rpf.Root,"x64"),"levels");
  var gta=RpfFile.CreateDirectory(x64,"gta5");
  var inner=RpfFile.CreateNew(gta,"vehicles.rpf");
  RpfFile.CreateFile(inner.Root,"vehshare.ytd",ytd);
  File.Move(fn,"dlc.rpf",true);Console.WriteLine("rpf "+new FileInfo("dlc.rpf").Length);
 }}
