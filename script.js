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
//potrzebny nodejs
    let track = xml.all[2].getElementsByTagName("TRACK");
   /*  console.log(track.length)
    console.log(track[0]);    
    console.log(track[0].getAttribute("TrackID"));
    console.log(track[0].getAttribute("Name"));
    console.log(track[0].getAttribute("Location"));
    let playlist = xml.all[].getElementsByTagName("PLAYLISTS");
    console.log(playlist) */
    let node = xml.all[0].getElementsByTagName("NODE");
    let plTrack = xml.all[0].getElementsByTagName("TRACK");
    console.log(plTrack);
    let i = 1;
    let p = 0;
 
    while(i<node.length-120){
        if(node[i].getAttribute("Type") == "0"){
            console.log("Folder: " + node[i].getAttribute("Name"));
        }
        else if(node[i].getAttribute("Type") == "1"){
            console.log("    Playlist: " + node[i].getAttribute("Name"));
            console.log("#EXTM3U")
            for(let o = 0;o<parseInt(node[i].getAttribute("Entries"));o++){
                let tid = plTrack[track.length+p].getAttribute("Key");
                p++;
                for(a = 0;a<track.length;a++){//chyba dodac wykonawce
                    if(tid == track[a].getAttribute("TrackID")){
                        console.log("#EXTINF:"+track[a].getAttribute("TotalTime")+","+track[a].getAttribute("Name")+"\n"+track[a].getAttribute("Location"))
                    }
                }
            }
        }        
        i++;
    } 
})