var jimp = require("jimp");
var fs = require("fs");


var resizeConfigFile = __dirname + '/config/resize.json';


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



if(process.argv[2]) {


	var photoFileName = process.argv[2]; 
 	var readConfigFile = resizeConfigFile;
 
 	//Read the config
 	readConfig(readConfigFile, function(conf, err) {

			   if(err) {
			   	 //There was a problem loading the config
				 console.log("Error reading config file:" + err);
				 process.exit(0);
					 
			   } else {
			   	   			   
			   	   var inputPhotoFileRenamed = photoFileName;		//Currently don't support renaming original file
				   var outputPhotoFile = photoFileName.replace(conf.incomingStringToReplace, conf.newFileRenamed);
				   
				   var width = conf.width;
				   if(width === "auto") {
				   	 //Keep the same width/height ratio
				   	 width = jimp.AUTO;
				   }
				   var height = conf.height;
				   if(height === "auto") {
				   	 //Keep the same height/width ratio
				   	 height = jimp.AUTO;
				   }
				   
				   
				   // open the photo file
				   jimp.read(photoFileName, function (err, photo) {
						if (err) throw err;
						photo.resize(width, height)            // resize 
							 .quality(conf.quality)                 // set JPEG quality 
							 .write(outputPhotoFile); // save 
				   });
				   
				   
				}
	});
} else {
	console.log("Usage: node photofile.jpg");

}
 	
 	
 	
 	
 
	