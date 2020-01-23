let getXMLFile = function(path, callback){
    let request = new XMLHttpRequest();
    request.open("GET",path);
    request.setRequestHeader("Content-Type", "text/xml");
    request.onreadystatechange = function(){
        if(request.readyState === 4 && request.status === 200){
            callback(request.responseXML);
        }
    };
    request.send();
};

getXMLFile("rekordbox.xml", function(xml){

    let track = xml.all[2].getElementsByTagName("TRACK");  
    let node = xml.all[0].getElementsByTagName("NODE");
    let plTrack = xml.all[0].getElementsByTagName("TRACK");
    let i = 1;
    let p = 0;
    let replacement = '\\';
    let count = 1;
    let folder = "root\\";

    var zip = new JSZip();
 
    while(i<node.length){
        if(node[i].getAttribute("Type") == "0"){ 
            let folder = "root\\"+node[i].getAttribute("Name")+"\\";
            console.log("Folder: " + folder);
        }
        else if(node[i].getAttribute("Type") == "1"){

            let name = node[i].getAttribute("Name");
            let playlist = "#EXTM3U";
            for(let o = 0;o<parseInt(node[i].getAttribute("Entries"));o++){
                let tid = plTrack[track.length+p].getAttribute("Key");
                p++;
                for(a = 0;a<track.length;a++){
                    if(tid == track[a].getAttribute("TrackID")){                        
                        let location = (track[a].getAttribute("Location")).substr(17).replace(/\//g, replacement);

                        playlist += ("\n#EXTINF:"+track[a].getAttribute("TotalTime")+","+track[a].getAttribute("Name")+" - "+track[a].getAttribute("Artist")+"\n"+decodeURIComponent(location))
                    }
                } 
            }

            zip.file(/* folder+ */name.replace(/\//g, "-") + ".m3u", playlist);//nazwy plikow nie moga zawierac slashy, skrypt metodą replace podmienia je na myślniki
        }        
        i++;
    }
    zip.generateAsync({type:"blob"}).then(function(content) {
        saveAs(content, "rekordbox.zip");
    }); 
})