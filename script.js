/*
todo:
1.zrobić funkcję makePlaylist()
2.poprzenosic powtarzajace sie zmienne do sekcji globalnej
3.napisac funkcjonalnosc usuwajaca duplikaty w playliscie
4.uwzględnić hierarchię folderów przy eksporcie playlist do zipa
5.zaprojektować interfejs graficzny z mozliwoscia wyboru pliku xml
6.napisać konwersję xml rekordboxa do nml traktora(i na odwrót)
7.dodac funkcjonalność usuwającą fizycznie z dysku utworu zgromadzone w konkretnej playliscie(np. kosz)
8.funkcja generująca raport o ilości utworów w każdej playliście
9.dodac mozliwosc przegladania wybranych playlist(lub pomijania inteligentnych)
10.wyszukiwanie brakujacych utworów
*/

let xmlFile = 'rekordbox.xml';

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

function convertRbtoTrk(xmlFile){
    getXMLFile(xmlFile, function(xml){
        let track = xml.all[2].getElementsByTagName("TRACK");  
        let node = xml.all[0].getElementsByTagName("NODE");
        let d = new Date();
        
        

        console.log(track[1]);
        //deklaracja nml-a
        console.log('<?xml version="1.0" encoding="UTF-8" standalone="no" ?>\n<NML VERSION="19"><HEAD COMPANY="www.native-instruments.com" PROGRAM="Traktor"></HEAD>\n  <MUSICFOLDERS></MUSICFOLDERS>\n    <COLLECTION ENTRIES="'+track.length+'">');
        //dodawanie utworu do kolekcji(konwersja z rb do trk) 
        let location=track[1].getAttribute("Location");
        location = decodeURIComponent(location);
        let location_folders = location.substring(19,location.lastIndexOf("/"));
        location_folders = location_folders.replace(/\//g,"/:");
        let location_filename = location.substring(location.lastIndexOf("/")+1)
        let location_volume = location.substring(17,19);
        //sprawdzic jaka ma byc wartosc w VOLUMEID
        //zobaczyć jaka wartosc ma być w MODIFIED_TIME
        //FLAGS
        //sprawdzić FILESIZE dla pewnosci (czy mb czy mib)
        //dodać import cue
        //zobaczyć musical_key
        console.log('<ENTRY MODIFIED_DATE='+d.getFullYear()+'/'+(d.getMonth()+1)+'/'+d.getDate()+' MODIFIED_TIME="'+d.getTime()+' TITLE="'+track[1].getAttribute("Name")+'" ARTIST="'+track[1].getAttribute("Artist")+'" <LOCATION DIR="'+location_folders+'/:"'+' FILE="'+location_filename+'" VOLUME="'+location_volume+'" VOLUMEID="dc962188></LOCATION><MODIFICATION_INFO AUTHOR_TYPE="user"></MODIFICATION_INFO><INFO BITRATE="'+track[1].getAttribute("BitRate")+'000'+'" GENRE="'+track[1].getAttribute("Genre")+'" KEY="'+track[1].getAttribute("Tonality")+'" PLAYTIME="'+track[1].getAttribute("TotalTime")+'" IMPORT_DATE="'+track[1].getAttribute("DateAdded").replace(/-/g,"/")+'" RELEASE_DATE="'+track[1].getAttribute("Year")+'/1/1" FILESIZE="'+track[1].getAttribute("Size")+'"></INFO>\n<TEMPO BPM='+track[1].getAttribute("AverageBpm")+'0000" BPM_QUALITY="100.000000"></TEMPO>\n</ENTRY>');

        console.log('</COLLECTION>\n</NML>')
    }); 

}