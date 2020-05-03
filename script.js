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
let pathStorage = [];
function tree(xmlFile ,format){
    getXMLFile(xmlFile,function(xml){   
        let node = xml.all[0].getElementsByTagName("NODE");
        if(format == 1){
            format = ".m3u";
        }
        if(format == 2){
            format = "";
        }
        let playlists = [];
        let folders = [];
        for(let i=0;i<node.length;i++){
            if(node[i].getAttribute("Type")=='1'){
                    var current = node[i];
                    var playlistTree = [];
                    while (current.parentNode && current.getAttribute("Name")!='ROOT'){
                        playlistTree.push(current)
                        current = current.parentNode
                    }
                playlistTree.reverse();
                playlists.push(playlistTree);
            }                    
        } 
        for(let i=0;i<node.length;i++){
            if(node[i].getAttribute("Type")=='0'){
                    var current = node[i];
                    var foldersTree = [];
                    while (current.parentNode && current.getAttribute("Name")!='ROOT'){
                        foldersTree.push(current)
                    current = current.parentNode
                    }
                foldersTree.reverse();
                folders.push(foldersTree);
            }                    
        }
        for(i=0;i<playlists.length;i++){
            let path = '';            
            for(let o=0;o<(playlists[i].length);o++){
                if(o==playlists[i].length-1){//playlists
                    path += playlists[i][o].getAttribute("Name")+format;
                }
                else{
                    path += playlists[i][o].getAttribute("Name")+'\\';
                }
            }
            pathStorage.push(path)       
        }       
    });
    return pathStorage;
}
function genHexString(len) {
    const hex = '0123456789abcdef';
    let output = '';
    for (let i = 0; i < len; ++i) {
        output += hex.charAt(Math.floor(Math.random() * hex.length));
    }
    return output;
}
//funkcje programu
function exportTo_m3u(xmlFile){   
    tree(xmlFile,1); 
    getXMLFile(xmlFile, function(xml){ 
        let track = xml.all[2].getElementsByTagName("TRACK");  
        let node = xml.all[0].getElementsByTagName("NODE");
        let plTrack = xml.all[0].getElementsByTagName("TRACK");
        let i = 0;
        let p = 0;
        let q = 0;
        let replacement = '\\';
        var zip = new JSZip();
        
        while(i<(node.length)){
            if(node[i].getAttribute("Type") == "1"){                
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
                zip.file(pathStorage[q].replace(/\//g, "-"), playlist);//nazwy plikow nie moga zawierac slashy, skrypt metodą replace podmienia je na myślniki-na przyszłosc dodac podmienianie reszty znaków nie mogących znajdowac się w nazwie pliku         
                console.log(q + ' ' + pathStorage[q].replace(/\//g, "-")); 
                q++;   
            }  
            i++;            
        }
        zip.generateAsync({type:"blob"}).then(function(content) {
        saveAs(content, "rekordbox.zip");
        }); 
    })
    pathStorage = [];
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
function keyToMusicalKey(key){
    switch(key){//poprawić, źle przypisuje klucze, brakuje m
        case '1A':
            return '6m';
            break;
        case '2A':
            return '7m';
            break;
        case '3A':
            return '8m';
            break;
        case '4A':
            return '9m';
            break;
        case '5A':
            return '10m';
            break;
        case '6A':
            return '11m';
            break;
        case '7A':
            return '12m';
            break;
        case '8A':
            return '1m';
            break;
        case '9A':
            return '2m';
            break;
        case '10A':
            return '3m';
            break;
        case '11A':
            return '4m';
            break;
        case '12A':
            return '5m';
            break;

            case '1B':
                return '6d';
                break;
            case '2B':
                return '7d';
                break;
            case '3B':
                return '8d';
                break;
            case '4B':
                return '9d';
                break;
            case '5B':
                return '10d';
                break;
            case '6B':
                return '11d';
                break;
            case '7B':
                return '12d';
                break;
            case '8B':
                return '1d';
                break;
            case '9B':
                return '2d';
                break;
            case '10B':
                return '3d';
                break;
            case '11B':
                return '4d';
                break;
            case '12B':
                return '5d';
                break;

          default:
            return '';
    }
}
function convertRbtoTrk(xmlFile){
    //tree(xmlFile,2); 
    getXMLFile(xmlFile, function(xml){
        //AUDIO_ID przechowuje waveform utworu chyba w base64
        //POLSKIE ZNAKI a raczej ich brak
        //sprawdzic jaka ma byc wartosc w VOLUMEID
        //zobaczyć jaka wartosc ma być w MODIFIED_TIME << chyab data modyfikacji z metadanych konkretnego utworu (nie ma raczej tej informacji w rekordbox.xml)(https://www.google.com/search?client=firefox-b-d&q=js+read+metadata+from+mp3+on+local+drive)
        //FLAGS
        //sprawdzić FILESIZE (jestem blisko ale wynik moze nie byc do konca dokladny)
        //dodać import cue
        //zobaczyć musical_key
        let track = xml.all[2].getElementsByTagName("TRACK");  
        let node = xml.all[0].getElementsByTagName("NODE");
        let plTrack = xml.all[0].getElementsByTagName("TRACK");
        let d = new Date();
        //deklaracja nml-a
        //jeśli nie masz zainstalowanego traktora, utworzoną kolekcję zapisz w następującej lokalizacji: "C:\Users\$username\Documents\Native Instruments\Traktor 3.1.0"
        let collection = '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>\n<NML VERSION="19"><HEAD COMPANY="www.native-instruments.com" PROGRAM="Traktor"></HEAD>\n  <MUSICFOLDERS></MUSICFOLDERS>\n    <COLLECTION ENTRIES="'+track.length+'">';
        function addTracks(){
            for(let i=1;i<track.length;i++){
                //dodawanie utworu do kolekcji(konwersja z rb do trk) 
                let location=track[i].getAttribute("Location");
                location = decodeURIComponent(location);
                let location_folders = location.substring(19,location.lastIndexOf("/"));
                location_folders = location_folders.replace(/\//g,"/:");
                let location_filename = location.substring(location.lastIndexOf("/")+1)
                let location_volume = location.substring(17,19);        
                collection += '<ENTRY MODIFIED_DATE="'+d.getFullYear()+'/'+(d.getMonth()+1)+'/'+d.getDate()+'" MODIFIED_TIME="'+d.getTime()+'" TITLE="'+he.encode(track[i].getAttribute("Name"))+'" ARTIST="'+he.encode(track[i].getAttribute("Artist"))+'"><LOCATION DIR="'+location_folders+'/:"'+' FILE="'+he.encode(location_filename)+'" VOLUME="'+location_volume+'" VOLUMEID="dc962188"></LOCATION><MODIFICATION_INFO AUTHOR_TYPE="user"></MODIFICATION_INFO><INFO BITRATE="'+track[i].getAttribute("BitRate")+'000'+'" GENRE="'+he.encode(track[i].getAttribute("Genre"))+'" COMMENT="'+he.encode(track[i].getAttribute("Comments"))+'" KEY="'+he.encode(track[i].getAttribute("Tonality"))+'" PLAYTIME="'+track[i].getAttribute("TotalTime")+'" IMPORT_DATE="'+track[i].getAttribute("DateAdded").replace(/-/g,"/")+'" RELEASE_DATE="'+track[i].getAttribute("Year")+'/1/1" FILESIZE="'+track[i].getAttribute("Size")/1000+'"></INFO>\n<TEMPO BPM="'+track[i].getAttribute("AverageBpm")+'0000" BPM_QUALITY="100.000000"></TEMPO><MUSICAL_KEY VALUE="'+keyToMusicalKey(track[i].getAttribute("Tonality"))+'"/>\n</ENTRY> \n';
            }
            collection += '</COLLECTION>\n';   
        }
        addTracks();        
        collection += '<SETS ENTRIES="0"></SETS>\n<PLAYLISTS>\n<NODE TYPE="FOLDER" NAME="$ROOT"><SUBNODES COUNT="'+(2+parseInt(node[0].getAttribute("Count")))+'">\n<NODE TYPE="PLAYLIST" NAME="_LOOPS">\n<PLAYLIST ENTRIES="0" TYPE="LIST" UUID="'+genHexString(32)+'">\n</PLAYLIST>\n</NODE>\n<NODE TYPE="PLAYLIST" NAME="_RECORDINGS"> <PLAYLIST ENTRIES="0" TYPE="LIST" UUID="'+genHexString(32)+'"> </PLAYLIST></NODE>\n';
        function pad(number, length) {   
            var str = '' + number;
            while (str.length < length) {
                str = '0' + str;
            }           
            return str;        
        }

        function makeTree(i){
            if(node[i].getAttribute("Type")=='0'){
                //tu jest potrzebne działanie bardzo mądrej głowy :-)
            }
            else{
                //petla pobierajaca rodzicow playlisty do jej nazwy w kolekcji traktor(workaround)
                var current = node[i];
                var playlistTree = [];
                while (current.parentNode && current.getAttribute("Name")!='ROOT'){
                    playlistTree.push(current.getAttribute("Name")); 
                    current = current.parentNode
                }
                let Tree = '';
                for(let q=playlistTree.length-1;q>0;q--){
                    Tree += playlistTree[q]+'\\';
                }


                collection+='<NODE TYPE="PLAYLIST" NAME="'+pad(i,3)+'('+/* he.encode */(Tree/* node[i].parentNode.getAttribute("Name") */)+')'+he.encode(node[i].getAttribute("Name"))+'">';
                collection+='<PLAYLIST ENTRIES="'+node[i].getAttribute("Entries")+'" TYPE="LIST" UUID="'+genHexString(32)+'">\n';
                //szukanie utworów w bazie
                for(let o=0;o<parseInt(node[i].getAttribute("Entries"));o++){
                    let children = node[i].childNodes;
                    for(let p=0;p<track.length;p++){                            
                        if(node[i].children[o].getAttribute("Key")==track[p].getAttribute("TrackID")){
                            collection+='<ENTRY><PRIMARYKEY TYPE="TRACK" KEY="'+((he.encode(decodeURIComponent(track[p].getAttribute("Location")))).substring(17)).replace(/\//g,"/:")+'"></PRIMARYKEY>\n</ENTRY>\n';
                        }                        
                    }
                }
                collection+='</PLAYLIST></NODE>'
                console.log(Tree+node[i].getAttribute("Name"));
            }            
        }
        for(let i=0;i<node.length;i++){
            makeTree(i)
        }        
        collection+='</SUBNODES>\n</NODE>\n</PLAYLISTS>';
        collection+='\n</NML>'
        //console.log(collection)
        var blob = new Blob([collection], {type:"text/plain;charset=utf-8"});
        saveAs(blob,"collection.nml");
    }); 
}