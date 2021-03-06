/* 

	This function will prepare a settings snippet for display as soon as the settings tab is entered

*/

var fs = require('fs');

var verbose = false;

//Globals
var resizeConfigFile = __dirname + '/config/resize.json';
var mainMedImagePath = "../../photos/";


function readConfig(confFile, cb) {
	//Reads and updates config with a newdir in the output photos - this will overwrite all other entries there
	//Returns cb(err) where err = null, or a string with the error


	//Write to a json file with the current drive.  This can be removed later manually by user, or added to
	fs.readFile(confFile, function read(err, data) {
		if (err) {
				cb(null, "Sorry, cannot read config file! " + err);
		} else {
			var content = JSON.parse(data);

			cb(content, null);
		};
	});

}



readConfigFile = resizeConfigFile;
 
//Read the config
readConfig(readConfigFile, function(conf, err) {

		   if(err) {
			 //There was a problem loading the config
			 console.log("Error reading config file:" + err);
			 process.exit(0);
				 
		   } else {
						   			   
			   var width = conf.width;
			   var height = conf.height;
			  
			   console.log("returnParams:?WIDTHVAL=" + width + "&HEIGHTVAL=" + height + "&QUALITYVAL=" + conf.quality + "&INSTRINGVAL=" + conf.incomingStringToReplace + "&OUTRENAMEDVAL=" + conf.newFileRenamed);
			   
			}
});
