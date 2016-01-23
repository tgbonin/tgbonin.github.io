"use strict";
	
window.onload = init;

function init(){
	loadProjects();
}

function loadProjects(){
	$.ajax({
		url: "projects.json",
		dataType: "JSON",
		type: "GET",
		success: function(result){
			console.dir(result);
			
			for(var i = 0; i < result.projects.length; i++){
				addProjectToDiv(result.projects[i]);
			}
		}
	});
}

function addProjectToDiv(project){
	var projDiv = document.createElement("div");
	projDiv.className ='projectPreview';
	
	var titleH2 = document.createElement("h2");
	var titleText = document.createTextNode(project.name);
	titleH2.appendChild(titleText);
	titleH2.setAttribute('margin', '0 auto');
	projDiv.appendChild(titleH2);
	
	var projImg = document.createElement("img");
	projImg.setAttribute('src', "media/images/projectImages/" + project.image);
	projImg.setAttribute('width', '90%');
	projImg.setAttribute('margin', '0 auto');
	projDiv.appendChild(projImg);
	
	var description = document.createElement('p');
	var descText = document.createTextNode(project.description);
	description.appendChild(descText);
	projDiv.appendChild(description);
	
	var skillList = document.createElement('ul');
	
	for(var k = 0; k < project.skills.length; k++){
		var skill = document.createElement('li');
		var skillTxt = document.createTextNode(project.skills[k]);
		skill.appendChild(skillTxt);
		skillList.appendChild(skill);
	}
	
	projDiv.appendChild(skillList);

	document.querySelector("#projects").appendChild(projDiv);
}