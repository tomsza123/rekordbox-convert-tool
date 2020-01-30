/*
todo:
1.zrobić funkcję makePlaylist()
2.poprzenosic powtarzajace sie zmienne do sekcji globalnej
3.uwzględnić hierarchię folderów przy eksporcie playlist do zipa
4.zaprojektować interfejs graficzny z mozliwoscia wyboru pliku xml
5.napisać konwersję xml rekordboxa do nml traktora
*/
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

function exportTo_m3u(xmlFile){    
    getXMLFile(xmlFile, function(xml){ 
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
                //console.log("Folder: " + folder);
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
}

function tracksWithoutPlaylist(xmlFile){
    getXMLFile(xmlFile, function(xml){
        let track = xml.all[2].getElementsByTagName("TRACK");  
        let node = xml.all[0].getElementsByTagName("NODE");
        let plTrack = xml.all[0].getElementsByTagName("TRACK");
        let i = 1;
        let p = 0;
        let tid = [];
        let IDexist = [];
        let CollectionID = [];
        let replacement = '\\';
        let count = 1;
        let folder = "root\\";
        let playlist = "#EXTM3U";
        while(i<node.length){ 
            if(node[i].getAttribute("Type") == "1"){ 
                //console.log("przegladam playlistę: "+ node[i].getAttribute("Name"));
                for(let o=0;o<parseInt(node[i].getAttribute("Entries"));o++){
                    tid.push(plTrack[track.length+p].getAttribute("Key"));
                    p++;
                    IDexist = [...new Set(tid)];//usuwanie duplikatów
                }
            } 
        i++;  
        }
        for(let a = 0;a<track.length; a++){
            CollectionID.push(track[a].getAttribute("TrackID"));
            IDexist.push(track[a].getAttribute("TrackID"));
        }    
        const IDnotExist = IDexist.filter(function(item, pos) {
            return IDexist.lastIndexOf(item) == IDexist.indexOf(item);
        });
        for(let o = 0;o<IDnotExist.length;o++){
            for(a = 0;a<track.length;a++){
                if(IDnotExist[o] == track[a].getAttribute("TrackID")){
                    let location = (track[a].getAttribute("Location")).substr(17).replace(/\//g, replacement);    
                    playlist += ("\n#EXTINF:"+track[a].getAttribute("TotalTime")+","+track[a].getAttribute("Name")+" - "+track[a].getAttribute("Artist")+"\n"+decodeURIComponent(location))
                }
            }        
        }   
        var blob = new Blob([playlist], {type:"text/plain;charset=utf-8"});
        saveAs(blob,"rb_not_exist_in_playlists.m3u"); 
    }); 
}