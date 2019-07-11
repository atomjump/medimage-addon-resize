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
	firstRun: [true|false]  - from a full install, this should be set to 'true' to enable adding menu elements etc.
								However, we don't want to add those menu elements twice, so the 2nd time we can leave this off.

*/ 

var async = require("async");
var queryString = require('querystring');
var fs = require('fs');
var fsExtra = require('fs-extra');
const cheerio = require('cheerio');
var exec = require('child_process').exec;


var verbose = false;

var thisAddOnConfigFile = __dirname + '/config/patch.json';
var medImageAddonConfig = __dirname + "/../config.json";

var pm2Parent = '';		//Include a string if this is run on linux that represents the MedImage server to restart


//Utility functions
function removeLastInstance(badtext, str) {
    var charpos = str.lastIndexOf(badtext);
    if (charpos<0) return str;
    ptone = str.substring(0,charpos);
    pttwo = str.substring(charpos+(badtext.length));
    return (ptone+pttwo);
}	

function strFunctionInserter(func) {
	var strver = func.toString();
	strver = strver.replace("function () {","");		//Get rid of first function
	strver = removeLastInstance("}", strver);
	return JSON.stringify(strver);
}	


//Add-on content
var pagesToRemove = [
		thisAddOnConfigFile		
	];
	//Keeping addon-settings because other addons may use that
	
	
	

//This function's contents will be placed into the HTML as-is
var jQueryDyn = function() {
	jQuery(document).ready(function(){
		jQuery('#resize-tab').click(function() {
			//Get the current settings HTML snippet via an ajax request

			uri = "/addon/patch/";
			jQuery.ajax({
				url: uri,
				success: function(data) {
					jQuery('#resize').html(data);
				}
			 }); 

		});

	});
}	
	
var htmlToInsert = [
	];
	/*
		Or a remove example
		{
			"file": __dirname + "/../../public/components/header.html",
			"selector": "#settings",
			"remove": true
		},
	
	*/

var thisAppEventPhotoWritten = [
                       		 	];
var thisAppEventURLRequest = [
                       		 ];
                       		 
var outgoingOptions = {};


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


function removeFromArray(objCheck, inThisArray) 
{
	//Checks the objCheck is not already in the array - saves us from doubling up. Note - if the status
	//is true vs false, it will still include both options.
	//Returns true if in the array, and false if not.
	var strOfObj = JSON.stringify(objCheck);
	
	for(var cnt = inThisArray.length - 1; cnt >= 0; cnt--) {		//Moving downwards to keep shifting them out
		if(strOfObj === JSON.stringify(inThisArray[cnt])) {
			inThisArray.splice(cnt, 1);
		}
	}
	
	return true;

}



function removeFromMedImageServerConfig(configContents, removeObjArray, eventName)
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
	
	
	
	
	//Go through the array of objects forwards
	for(var cnt = 0; cnt< removeObjArray.length; cnt++) {
			
		removeFromArray(removeObjArray[cnt], configContents.events[eventName]);

	}
	
	
	return configContents;
}




function restartParentServer(cb)
{
	//Restart the parent MedImage service
	var platform = process.platform;
	var isWin = /^win/.test(platform);
	if(isWin) {
		var run = 'net stop MedImage';
		if(verbose == true) console.log("Running:" + run);
		exec(run, function(error, stdout, stderr){
			if(error) {
				console.log("Error stopping MedImage:" + error);
				cb();
			
			} else {
				console.log(stdout);
			
				var run = 'net start MedImage';
				exec(run, function(error, stdout, stderr){
					if(error) {
						console.log("Error starting MedImage:" + error);
						cb();
					} else {
						console.log(stdout);
						cb();
					}
				});
			}
		});
	} else {
	   //Probably linux
	   if((pm2Parent) && (pm2Parent != '')) {
		   var run = 'pm2 restart ' + pm2Parent;
			if(verbose == true) console.log("Running:" + run);
			exec(run, function(error, stdout, stderr){
				console.log(stdout);
				cb();
			});
		}
	}

}


function getPlatform() {
	var platform = process.platform;
	if(verbose == true) console.log(process.platform);
	var isWin = /^win/.test(platform);
	if(verbose == true) console.log("IsWin=" + isWin);
	if(isWin) {
		if(process.arch == 'x64') {
			return "win64";
		} else {
			return "win32";
		}
	} else {
		if(platform == "darwin") {
			return "mac";
		} else {
			return "unix";
		}
	
	}
}





	
//Read in the local app's config file

async.waterfall([
	function(callback) {
		//Read the medImage AddonConfig
		readConfig(medImageAddonConfig, function(parentConfigContents, err) {
			if(err) {
				console.log("Warning: Could not load the config file to remove elements.");	
				callback(null);
			
			} else {
						
				//Modify the addon config for the master server
				parentConfigContents = removeFromMedImageServerConfig(parentConfigContents, thisAppEventPhotoWritten, "photoWritten");
				parentConfigContents = removeFromMedImageServerConfig(parentConfigContents, thisAppEventURLRequest, "urlRequest");
						  
				callback(null, parentConfigContents);				
			}
			
		});
		
	},
	function(parentConfigContents, callback) {
		writeConfig(medImageAddonConfig, parentConfigContents, function(err) {
			if(err) {
				console.log("Warning: problem saving the add-on config file:" + err);
				callback(null); 
	
			} else {
				//Success
				callback(null);
			}			
		});
	},
	function(callback) {
		//Copy across any pages that need inserting
		
		//But only do this on the first run
	
		async.eachOf(pagesToRemove,
				// 2nd param is the function that each item is passed to
				function(pageRem, cnt, cb){
					fs.unlink(pageRem, function(err) {
					
						if(err) {
							console.log("Warning: could not remove the page: " + pageRem);
						}
						cb(null);
					});
					
					
				},	//End of async eachOf single item
				function(err){
					// All tasks are done now
					if(err) {
					   console.log('ERR:' + err);
					   callback(err);
					 } else {
					   console.log('Completed all page removals.');
					   callback(null);
					 }
				   }
			); //End of async eachOf all items
		
	},
	function(callback) {
		//Remove any menus or any other html pages that were adjusted
		
			
		async.eachOf(htmlToInsert,
			// 2nd param is the function that each item is passed to
			function(htmlIns, cnt, cb){
				
		
				var htmlSource = fs.readFileSync(htmlIns.file, "utf8");
		
				const $ = cheerio.load(htmlSource);
		
			
				if(htmlToInsert[cnt].append) {
					console.log("Check exists id: " + htmlIns.newId);
					var exists = $("#" + htmlIns.newId).length;
					if(!exists) {
						//Only insert if not already there
						console.log("Doesn't exist");
						$(htmlIns.selector).append(htmlIns.append);
					} else { 
						console.log("Already exists");
					}
				}
		
				if(htmlIns.remove) {
					$(htmlIns.selector).remove();
				}

				if(verbose == true) console.log("New HTML:" + $.html());
				fs.writeFileSync(htmlIns.file, $.html());
				cb(null);
			
			},	//End of async eachOf single item
			  function(err){
				// All tasks are done now
				if(err) {
				   console.log('ERR:' + err);
				   callback(err);
				 } else {
				   console.log('Completed all code removal!');
				   
				   //Ensure we reload the important bits of the server, header page and config
				   // (but do not restart it - as it could be the server running this installer)
				   console.log("reloadConfig:true");
				   callback(null);
				   
				   /* However, if this was a standalone .exe installer, we would need code here to restart the 
				   server independently. ie.
				   var platform = getPlatform();
				   if((platform == "win32")||(platform == "win64")) {
					   //Now we need to restart the MedImage Server service (particularly if we have changed the header
					   //which is stored in RAM)
					   restartParentServer(function(){ 
								callback(null);
						   
					   });
					}
					*/
				 }
			   }
		); //End of async eachOf all items
										
			
			
			
			

	}
	
], function (err, result) {
	// result now equals 'done'
	if(err) {
		console.log("The uninstall was not complete.");
		process.exit(1);
	} else {
		console.log("The uninstall was completed successfully!");
		console.log("returnParams:?");
		process.exit(0);
	}
});

			


