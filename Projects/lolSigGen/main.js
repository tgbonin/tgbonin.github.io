"use strict";
	
	window.onload = init;
	
	//object to store all of the variables for the player
	var playerObject = {
		playerName: "",
		displayName: "",
		playerID: "",
		iconID: 0,
		playerLevel: 0,
		championsPlayed: [],
		playerRank: "",
		rankLevel: 0,
		rankName: "",
		playerWinsR: 0,
		playerWinsU: 0,
		playerCKillsU: 0,
		numChampsPlayed: 0
	};
	
	function init(){
		//callback for the Create Signature button; starts getting the player's info
		document.querySelector("#btnCreate").onclick = (function(){
			document.querySelector("#btnCreate").disabled = true;
			getPlayerID();
		});
		
		//callback for the searchbar; detects the enter key and presses the create button
		document.querySelector("#searchName").addEventListener("keyup", function(e){
			if(e.keyCode == 13){
				document.querySelector("#btnCreate").click();
			}
		});
		
		//callback for the download button; saves the canvas as an image and sets the download 
		var dlButton = document.querySelector("#btnSigDownload");
		dlButton.onclick = function(){
			//console.log("downloading");
			var dataURL = document.querySelector("#infoCanvas").toDataURL('image/png');
			dlButton.download = playerObject.playerName + "Signature.png";
			dlButton.href = dataURL;
		};
		
		//callback for the upload to imgur button
		document.getElementById("btnSigUpload").onclick = (function(){
			var d = document.getElementById("micError");
			d.innerHTML = "Uploading to Imgur...";
			d.style.animationName = '';
			d.style.animationName = 'fadeInOut';
			
			//disables the button so that the user doesn't upload multiple times
			var btn = document.getElementById("btnSigUpload");
			btn.style.backgroundColor = "#aaa";
			btn.style.borderColor = "#888 #888 #ddd #ddd";
			btn.disabled = true;
			
			var img = document.getElementById('infoCanvas').toDataURL('image/jpeg', 0.9).split(',')[1];
			uploadToImgur(img);
		});
		
		//console.log(('webkitSpeechRecognition' in window));
		
		if(('webkitSpeechRecognition' in window)) {
			document.getElementById('btnUseMic').style.display = 'inline-block';
		} else { document.getElementById('micError').style.animationName = 'fadeInOut'; }
		
		document.getElementById('btnUseMic').onclick = (function(e){
			//console.log("Button clicked");
			enableSpeech();
		});
		
		//start the initial page animation
		startPageAnimation();
	}
	
	//function to handle the speech recognition 
	function enableSpeech(){
		if(('webkitSpeechRecognition' in window)){
			var final_transcript = '';
			var recognizing = false;
			var ignore_onend;
			var start_timestamp;
			
			var recognition = new webkitSpeechRecognition();
			recognition.continuous = false;
			recognition.interimResults = true;
			
			recognition.onstart = function(){
				recognizing = true;
				//console.log("recording");
				
				document.querySelector("#micImage").src = "media/images/micOn.png";
			};
			
			recognition.onerror = function(event){
				document.querySelector("#micImage").src = "media/images/mic.png";
				if (event.error == 'no-speech') {
					//console.log("no-speech error");
					ignore_onend = true;
				}
				if (event.error == 'audio-capture') {
					//console.log("audio-capture error");
					ignore_onend = true;
				}
				if (event.error == 'not-allowed') {
					//console.log("not-allowed error: " + event.message);
					//console.dir(event);
					ignore_onend = true;
				}
			};
			
			recognition.onend = function(){
				recognizing = false;
				document.querySelector("#micImage").src = "media/images/mic.png";
			}
			
			recognition.onresult = function(event){

				var interim_transcript = '';
				
				for (var i = event.resultIndex; i < event.results.length; ++i) {
					if (event.results[i].isFinal) {
						final_transcript += event.results[i][0].transcript;
					} else {
						interim_transcript += event.results[i][0].transcript;
					}
				}
				
				document.querySelector("#searchName").value = final_transcript;
			}
			
			final_transcript = '';
			recognition.lang = 'en-US';
			recognition.start();
			//console.log("speech enabled");
		}
	}
	
	//plays the initial page animation
	function startPageAnimation() {
		//"Plays" the start effect for the main page
		var elementStyle;
		elementStyle = document.querySelector("#startContents").style;
		elementStyle.width = "900px";
		elementStyle.opacity = "1.0";
	}
	
	//plays the reverse initial animation and then plays the second page animation
	//after a slight delay
	function loadDataPage() {
		//init page
		var elementStyle = document.querySelector("#startContents").style;
		elementStyle.width = "0px";
		elementStyle.opacity = "0";
		elementStyle.transitionDelay = "1s, 0s";
		
		//data page
		elementStyle = document.querySelector("#infoPage").style;
		elementStyle.display = "block";
		elementStyle.width = "90%";
		var newHeight = document.querySelector("#infoContentContainer").clientHeight;
		//console.log(newHeight);
		elementStyle.height = (newHeight + "px");
		elementStyle.opacity = "1.0";
		
		setupCanvas();
	}
	
	//gets the player's id by summoner name as well as a couple other pieces of information
	function getPlayerID() {
		var playerWithoutSpacesLower = "";
		var userInput = document.querySelector("#searchName").value;
		userInput.trim();
		playerObject.playerName = userInput;
		
		var xhrPlayerID = new XMLHttpRequest();
		xhrPlayerID.onload = function(){
			if(xhrPlayerID.status == 200){
				var myJSON = JSON.parse( xhrPlayerID.responseText );
				playerObject.playerID = myJSON[playerWithoutSpacesLower].id;
				playerObject.playerLevel = myJSON[playerWithoutSpacesLower].summonerLevel;
				playerObject.iconID = myJSON[playerWithoutSpacesLower].profileIconId;
			
				getPlayerDisplayName();
			} else{
				var s = document.querySelector("#nameError");
				//console.log("yes");
				s.style.animationName = 'fadeInOut';
				document.querySelector("#btnCreate").disabled = false;
				
				s.addEventListener("animationend", function() {
					s.style.animationName = '';
				});
			}
		}
		
		playerWithoutSpacesLower = playerObject.playerName.replace(/\s+/g, '');
		playerWithoutSpacesLower = playerWithoutSpacesLower.toLowerCase();
		
		var url = "https://na.api.pvp.net/api/lol/na/v1.4/summoner/by-name/" + playerWithoutSpacesLower + "?api_key=0f6f00f5-c20b-40e9-9064-109ec3ad3c23";
		
		xhrPlayerID.open('GET', url, true);	
		xhrPlayerID.send();
	}
	
	//gets the player's in-game display name
	function getPlayerDisplayName() {
		var xhrPlayerName = new XMLHttpRequest();
		xhrPlayerName.onload = function(){
			var myJSON = JSON.parse( xhrPlayerName.responseText );
			playerObject.displayName = myJSON[playerObject.playerID].name;

			getUnrankedInfo();
		}
		
		var url = "https://na.api.pvp.net/api/lol/na/v1.4/summoner/" + playerObject.playerID + "?api_key=0f6f00f5-c20b-40e9-9064-109ec3ad3c23";
		
		xhrPlayerName.open('GET', url, true);	
		xhrPlayerName.send();
	}
	
	//gets various pieces of player information for unranked games
	function getUnrankedInfo() {
		var xhrPlayerInfo = new XMLHttpRequest();
		xhrPlayerInfo.onload = function(){
			var myJSON = JSON.parse( xhrPlayerInfo.responseText );
			
			var statSummaries = myJSON.playerStatSummaries;
			
			for(var i = 0; i < statSummaries.length; i++){
				var gameStats = statSummaries[i];
				if(gameStats.playerStatSummaryType == "Unranked")
				{						
					//insert this information into the first box on the data page
					var html = document.querySelector("#unrankedStats");
					
					html.innerHTML += "<h3>S5 Unranked Stats for: " + playerObject.displayName + "</h3>";
					html.innerHTML += "<p>Player ID: " + playerObject.playerID + "</p>";
					playerObject.playerWinsU = gameStats.wins;
					html.innerHTML += "<p>Wins: " + gameStats.wins + "</p>";
					playerObject.playerCKillsU = gameStats.aggregatedStats.totalChampionKills;
					html.innerHTML += "<p>Champion Kills: " + gameStats.aggregatedStats.totalChampionKills + "</p>";
					html.innerHTML += "<p>Minion Kills: " + gameStats.aggregatedStats.totalMinionKills + "</p>";
					html.innerHTML += "<p>Turret Kills: " + gameStats.aggregatedStats.totalTurretsKilled + "</p>";
					
					getRankedInfo();
					break;
				}
			}
		}
		
		var url = "https://na.api.pvp.net/api/lol/na/v1.3/stats/by-summoner/" + playerObject.playerID + "/summary?season=SEASON2015&api_key=0f6f00f5-c20b-40e9-9064-109ec3ad3c23";
		xhrPlayerInfo.open('GET', url, true);
		xhrPlayerInfo.send();
	}
	
	//Gets various pieces of information for the player's ranked games
	function getRankedInfo(){		
		var xhrRankInfo = new XMLHttpRequest();
		xhrRankInfo.onload = function(){
			console.log(xhrRankInfo.status);
			if(xhrRankInfo.status == 200){
				var myJSON = JSON.parse( xhrRankInfo.responseText );
				var queues = myJSON[playerObject.playerID];
				//console.log(playerObject.playerID);
				//console.dir(queues);
				
				for(var i = 0; i < queues.length; i++)
				{
					//console.log(queues[i].queue);
					if(queues[i].queue == "RANKED_SOLO_5x5"){
						playerObject.playerRank = queues[i].tier;
						playerObject.rankLevel = queues[i].entries[0].division;
						playerObject.playerWinsR = queues[i].entries[0].wins;
						playerObject.rankName = queues[i].name;
						
						loadChampions();
					}
				}
				
			}else{
				console.log("Got to unranked");
				playerObject.playerRank = "UNRANKED";
				//console.dir(playerObject);
				loadChampions();				
			}
			
			//put this info in the second data box
			var html = document.querySelector("#rankedStats");
			
			html.innerHTML += "<h3>S5 Ranked Stats for: " + playerObject.displayName + "</h3>";
			html.innerHTML += "<p>Wins: " + playerObject.playerWinsR + "</p>";
			html.innerHTML += "<p>Rank: " + playerObject.playerRank + " " + playerObject.rankLevel + "</p>";
			html.innerHTML += "<p>Division Name: " + playerObject.rankName + "</p>";
			
		}
		
		console.log("yep");
		
		var url = "https://na.api.pvp.net/api/lol/na/v2.5/league/by-summoner/" + playerObject.playerID + "/entry?api_key=0f6f00f5-c20b-40e9-9064-109ec3ad3c23";
		xhrRankInfo.open('GET', url, true);
		xhrRankInfo.send();
	}
	
	//loads recently played champions by the player
	function loadChampions() {
		var champsPlayed = [];
	
		var xhrChampionsRecent = new XMLHttpRequest();
		xhrChampionsRecent.onload = function(){
			var myJSON = JSON.parse( xhrChampionsRecent.responseText );
			
			var games = myJSON.games;
			
			for(var i = 0; i < games.length; i++){
				
				if(champsPlayed.indexOf(games[i].championId) == -1){
					champsPlayed.push(games[i].championId);
				}
				
				if(champsPlayed.length == 3){ break; }
				if(i == games.length -1){
					playerObject.numChampsPlayed = champsPlayed.length;
				}
			}			
			champsPlayed.forEach(getChampionKey);
		}
		
		var url = "https://na.api.pvp.net/api/lol/na/v1.3/game/by-summoner/" + playerObject.playerID + "/recent?api_key=0f6f00f5-c20b-40e9-9064-109ec3ad3c23";
		xhrChampionsRecent.open('GET', url, true);
		xhrChampionsRecent.send();
	}
	
	//get a champion key for the indicated champion name (string)
	function getChampionKey(champ){	
		console.log("eoginsoegins");
		var keys = [];
		
		var xhrChampInfo = new XMLHttpRequest();
		xhrChampInfo.onload = function(){
			var myJSON = JSON.parse( xhrChampInfo.responseText );
			var name = myJSON.key;
			playerObject.championsPlayed.push(name);
			
			console.log(playerObject.numChampsPlayed);
			
			if(playerObject.championsPlayed.length == playerObject.numChampsPlayed) {
				
				loadDataPage();
			}
		}
		
		var url = "https://global.api.pvp.net/api/lol/static-data/na/v1.2/champion/" + champ + "?api_key=0f6f00f5-c20b-40e9-9064-109ec3ad3c23";
		xhrChampInfo.open('GET', url, true);
		xhrChampInfo.send();
	}
	
	//sets up the canvas, displaying all of the information gathered as well as pictures
	function setupCanvas() {
		var ctx = document.querySelector("#infoCanvas").getContext("2d");
		var cWidth = ctx.canvas.width;
		var cHeight = ctx.canvas.height;
		
		var sigBack = document.getElementById("sigBase");
		ctx.drawImage(sigBack,5,5);
		
		ctx.fillStyle = "#e4a72a";
		ctx.fillRect(60,80,150,150);
		
		//gets and places the player's avatar
		var playerIcon = new Image();
		playerIcon.setAttribute('crossOrigin', 'anonymous');
		playerIcon.onload = function() {
			ctx.drawImage(playerIcon, 63, 83, 144, 144);
		};
		//url for the avatar
		playerIcon.src = "http://ddragon.leagueoflegends.com/cdn/5.23.1/img/profileicon/" + playerObject.iconID + ".png";
		
		ctx.fillStyle = "white";
		ctx.textAlign = "center";
		
		//name and level
		ctx.font = "24px League";
		ctx.fillText(playerObject.displayName, 135, 60);
		ctx.fillText("Level " + playerObject.playerLevel, 135, 270);
		
		//gets the correct rank badge 
		var playerBadge = new Image();
		playerBadge.onload = function() {
			ctx.drawImage(playerBadge, 260, 10, 175, 175);
		};
		playerBadge.src = "media/images/rankIcons/" + playerObject.playerRank + ".png";
		
		//checks if the user is unranked, and displays the correct information for rank and division
		ctx.font = "24px League";
		if(playerObject.playerRank != "UNRANKED"){
			ctx.fillText(playerObject.playerRank + " " + playerObject.rankLevel, 530, 95);
		} else { ctx.fillText("UNRANKED", 530, 95); }
		
		ctx.fillText("Wins: " + playerObject.playerWinsR, 530, 125);
		
		//console.dir(playerObject.championsPlayed);
		//console.log(playerObject.championsPlayed[0]);
		
		ctx.fillText("Normal Wins: " + playerObject.playerWinsU, 430, 200);
		ctx.fillText("Total Champion Kills: " + playerObject.playerCKillsU, 430, 245);		
		
		//gets the various champion icons
		var champIcon = new Image();
		champIcon.setAttribute('crossOrigin', 'anonymous');
		champIcon.onload = function() {
			ctx.drawImage(champIcon, 650, 38, 75, 75);
		};
		champIcon.src = "http://ddragon.leagueoflegends.com/cdn/5.14.1/img/champion/" + playerObject.championsPlayed[0] + ".png";
		
		var champIcon1 = new Image();
		champIcon1.setAttribute('crossOrigin', 'anonymous');
		champIcon1.onload = function() {
			ctx.drawImage(champIcon1, 650, 118, 75, 75);
		};
		champIcon1.src = "http://ddragon.leagueoflegends.com/cdn/5.14.1/img/champion/" + playerObject.championsPlayed[1] + ".png";
		
		var champIcon2 = new Image();
		champIcon2.setAttribute('crossOrigin', 'anonymous');
		champIcon2.onload = function() {
			ctx.drawImage(champIcon2, 650, 198, 75, 75);
		};
		champIcon2.src = "http://ddragon.leagueoflegends.com/cdn/5.14.1/img/champion/" + playerObject.championsPlayed[2] + ".png";
	}
	
	//uploads the current canvas to imgur
	function uploadToImgur(image){
		//console.log("Uploading...");
		
		var fd = new FormData();
		fd.append("image", image);
		
		var xhrUploadImg = new XMLHttpRequest();
		xhrUploadImg.onload = function(){
			var parse = JSON.parse(xhrUploadImg.responseText)
			//displays a prompt that shows the user their url for their image
			window.prompt("Link to your Signature:", parse.data.link);
		}
		
		xhrUploadImg.open('POST', "https://api.imgur.com/3/image.json");	
		xhrUploadImg.setRequestHeader('Authorization', 'Client-ID 02152b0bc277e9d');
		
		xhrUploadImg.send(fd);
	}
