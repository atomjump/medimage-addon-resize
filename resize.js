/*
	MedImage Resizing Add-on

	This script should sit in the addons/resize folder inside the MedImage Server directory,
	and is called by the MedImage Server (ver >= 0.8.0) once a photo is written. It resizes the image
	and writes the resulting new image into the same folder.
	
	The MedImage addons/config.json should have a new 'photoWritten' event entry like below;
	
	{
        "events": {
                "photoWritten": [
                        {
                                "addon": "Resize",
                                "runProcess": "node addons/resize/resize.js param1",
                                "active": true
                        }
                ]
        }
    }
    
    The configuration parameters are as follows:
    {
		"incomingStringToReplace": ".jpg",			- this is the string in the incoming filename to replace
		"currentFileRenamed": null,					- the current filename has the 'incomingStringToReplace' string replaced to this
														- a 'null' means no change. [currentFileRenamed is currently not supported] 
		"newFileRenamed": "-small.jpg",				- the new filename has the 'incomingStringToReplace' string replaced to this
													- and is created
		"width": 1200,								- the width of the new photo files in pixels. "auto" means it is
														- scaled proportionally to the original photo and the 'height' param
		"height": "auto",							- the height of the new photo files in pixels."auto" means it is
														- scaled proportionally to the original photo and the 'width' param
		"quality": 90								- the output .jpg quality from 0 - 100 %
	}

	
	
*/
var jimp = require("jimp");
var fs = require("fs");

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



if(process.argv[2]) {

  	var photoFileName = upath.normalize(__dirname + "/" + mainMedImagePath + process.argv[2]);
 	var readConfigFile = resizeConfigFile;
 	
 	console.log("Resizing photo file: " + photoFileName);
 
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
	console.log("Usage: node path/to/photofile.jpg");

}
 	
 	
 	
 	
 
	