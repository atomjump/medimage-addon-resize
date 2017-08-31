/* 

	MedImage Resizing Add-on Installation Script


	Input on the command-line (urlencoded get query params):
	
	height: [pixel number or "auto", where 'auto' matches the aspect ratio of the original and is based off the width]
	width: [pixel number or "auto", where 'auto' matches the aspect ratio of the original and is based off the height]
	quality: [0 - 100 as a percentage quality]
	incomingStringToReplace: [this is the string in the incoming filename to replace e.g. '.jpg']
	newFileRenamed: the new filename has the 'incomingStringToReplace' string replaced to this
													and is created e.g. '-small.jpg']
	prepend: [true|false]  - defaults to false, so it inserts at the end of the event list. true would insert at the beginning
						of the event list. This affects the order of things in the case of the 'photoWritten' event, which
						can be chained together with other image processing tasks.

*/ 

var async = require("async");
var queryString = require('querystring');
var fs = require('fs');

var thisAddOnConfigFile = 'config/resize.json';
var medImageAddonConfig = "../config.json";
var thisAppEventPhotoWritten = [{
                                "addon": "Resize",
                                "runProcess": "node addons/resize/resize.js param1",
                                "active": true
                       		 }];


function readConfig(confFile, cb) {
	//Reads and updates config with a newdir in the output photos - this will overwrite all other entries there
	//Returns cb(err) where err = null, or a string with the error


	//Write to a json file with the current drive.  This can be removed later manually by user, or added to
	fs.readFile(confFile, function read(err, data) {
		if (err) {
				cb(null, "Sorry, cannot read config file! " + err);
		} else {
			try {
				var content = JSON.parse(data);
				cb(content, null);
			} catch (e) {
				console.log("Error reading json file:" + JSON.stringify(e));
				cb({});		//Use a blank object file instead
			}

			
		};
	});

}


function writeConfig(confFile, content, cb) {
	//Write the file nicely formatted again
	fs.writeFile(confFile, JSON.stringify(content, null, 6), function(err) {
		if(err) {
			console.log("Error writing config file: " + err);
			cb(err);
			
		} else {
		
			console.log("The config file was saved! " + confFile);

		
			cb(null);
		}
	});
}


function inArrayAlready(objCheck, inThisArray) 
{
	//Checks the objCheck is not already in the array - saves us from doubling up. Note - if the status
	//is true vs false, it will still include both options.
	//Returns true if in the array, and false if not.
	var strOfObj = JSON.stringify(objCheck);
	
	for(var cnt = 0; cnt< inThisArray.length; cnt++) {
		if(strOfObj === JSON.stringify(inThisArray[cnt])) {
			return true;
		}
	}
	//Fall through - is not in array
	return false;

}


function addToMedImageServerConfig(configContents, insertObjArray, eventName, prepend)
{
	//In an already loaded config, insert the objects specified in the 'insertObjArray', into the event array called 'eventName'
	// (e.g. 'photoWritten' or 'urlRequest')
	//It will either insert it at the end (prepend = false) or at the beginning (prepend = true).
	//
	//Will return the modified config file, which should then be written to disk again.
	if(!prepend) {
		var prepend = false;		//default to push at the end
	}

	if(!configContents.events) {
		configContents.events = [];
	}
	
	if(!configContents.events[eventName]) {
		configContents.events[eventName] = [];	
	}
	
	if(prepend == true) {
		//Go through the array of objects backwards
		for(var cnt = (insertObjArray.length - 1); cnt >= 0; cnt--) {
			if(! inArrayAlready(insertObjArray[cnt], configContents.events[eventName])) {
				configContents.events[eventName].unshift(insertObjArray[cnt]);	//insert at the start of the chain, but backwards so
			}														//it will keep the same order
		}
	} else {
		//Go through the array of objects forwards
		for(var cnt = 0; cnt< insertObjArray.length; cnt++) {
			if(! inArrayAlready(insertObjArray[cnt], configContents.events[eventName])) {
				configContents.events[eventName].push(insertObjArray[cnt]);	//insert at the end of the chain
			}
		}
	}
	
	return configContents;
}


function changeLocalConfig(configContents, opts)
{
	/* A typical local add-on config file:
		 {
			"incomingStringToReplace": ".jpg",
			"currentFileRenamed": null,
			"newFileRenamed": "-small.jpg",
			"width": 1200,
			"height": "auto",
			"quality": 90
		}
		*/
	//Put in some defaults if the object doesn't exist, but otherwise use the new data
	
	if(!configContents.incomingStringToReplace) {
		configContents.incomingStringToReplace = ".jpg";
	}
	if(opts.incomingStringToReplace) {
		configContents.incomingStringToReplace = opts.incomingStringToReplace;
	}
	
	if(!configContents.newFileRenamed) {
		configContents.newFileRenamed = "-small.jpg";
	}
	if(opts.newFileRenamed) {
		configContents.newFileRenamed = opts.newFileRenamed;
	}
	
	if(!configContents.width) {
		configContents.width = 1200;
	}
	if(opts.width) {
		if(opts.width == "auto") {
			configContents.width = opts.width;
		} else {
			configContents.width = parseInt(opts.width);
		}
	}
	
	if(!configContents.height) {
		configContents.height = "auto";
	}
	if(opts.height) {
		if(opts.height == "auto") {
			configContents.height = opts.height;
		} else {
			configContents.height = parseInt(opts.height);
		}
	}
	
	if(!configContents.quality) {
		configContents.quality = 90;
	}
	if(opts.quality) {
		configContents.quality = parseInt(opts.quality);
	}

	return configContents;
}






//Read in the command-line params
if(process.argv[2]) {

	//Incoming get requests are in normal "var=value&var2=value" format urlencoded
	var opts = queryString.parse(decodeURIComponent(process.argv[2]));
	
	//Read in the local app's config file

	async.waterfall([
		function(callback) {
			//Read the local add-on's config
			readConfig(thisAddOnConfigFile, function(childConfigContents, err) {
				if(err) {
					console.log("Error loading the add-on's own config file:" + err); 
					callback(err);
				} else {
					if(!childConfigContents) {
						childConfigContents = {};
					}
				
					//Modify the addon config for the master server
					childConfigContents = changeLocalConfig(childConfigContents, opts);
				
					callback(null, childConfigContents);				
				}
				
			});
		},
		function(childConfigContents, callback) {
			writeConfig(thisAddOnConfigFile, childConfigContents, function(err) {
				if(err) {
					console.log("Error saving the add-on config file:" + err);
					callback(err); 
		
				} else {
					//Success
					callback(null);
				}			
			});
		},
		function(callback) {
			//Read the medImage AddonConfig
			readConfig(medImageAddonConfig, function(parentConfigContents, err) {
				if(err) {
					console.log("Error loading the master add-on config file:" + err); 
					callback(err);
				} else {
					if((opts.prepend)&&(opts.prepend === "true")) {
						var prepend = true;
					} else {
						var prepend = false;
					}
		
					//Modify the addon config for the master server
					parentConfigContents = addToMedImageServerConfig(parentConfigContents, thisAppEventPhotoWritten, "photoWritten", prepend);
				
					callback(null, parentConfigContents);				
				}
				
			});
			
		},
		function(parentConfigContents, callback) {
			writeConfig(medImageAddonConfig, parentConfigContents, function(err) {
				if(err) {
					console.log("Error saving the add-on config file:" + err);
					callback(err); 
		
				} else {
					//Success
					callback(null);
				}			
			});
		}
	], function (err, result) {
		// result now equals 'done'
		if(err) {
			console.log("The installation was not complete.");
		} else {
			console.log("The installation was completed successfully!");
		}
	});

			


} else { 
	console.log("Usage: node install.js height=auto&width=1200&quality=90&incomingStringToReplace=.jpg&newFileRenamed=-small.jpg&prepend=false\n\nBut the parameter should be urlencoded.");
}
	


