var XMLFile;

function fileUpload() {
  XMLFile = document.getElementById("odfxml").files[0];
  ReadLibreOfficeXML();
}

function ReadLibreOfficeXML() {
  var mySlides = new Array();
  var fileReader = new FileReader();
  fileReader.readAsText(XMLFile);
  fileReader.onloadend = function () {
    var xmlData = $.parseXML(fileReader.result);
    $xml = $( xmlData );
    $page = $xml.find("page");

    $page.each(function (slideIndex,element) {
      $element= $(element);
      $frames = $element.find('frame');
      var slideElements = [];
      var elementContent = [];

      $frames.each(function (frameIndex,element) {
        if (element.attributes["presentation:class"] != null) {
          switch(element.attributes["presentation:class"].value){
            case "title":
              var slideElement = new SlideElement("TITRE");
              var elementContent = [];              
              for (var i = 0; i < element.getElementsByTagName("p").length; i++) {
                elementContent = element.getElementsByTagName("p").item(i).innerHTML;
                
              }
              slideElement.content(elementContent);
              slideElements[frameIndex] = slideElement;
              break;

            case "subtitle":
              var slideElement = new SlideElement("SOUS_TITRE");
              var elementContent = [];            
              for (var i = 0; i < element.getElementsByTagName("p").length; i++) {
                elementContent = element.getElementsByTagName("p").item(i).innerHTML;
                
              }
              slideElement.content(elementContent);
              slideElements[frameIndex] = slideElement;
              break;

            case "outline":
              var list = new SlideElement("LIST");
              for (var i = 0; i < element.getElementsByTagName("list").length; i++) {
                var listElement = [];
                for (var j = 0; j < element.getElementsByTagName("list").item(i).getElementsByTagName("list-item").length; j++) {
                  listElement[j] = new SlideElement("EL");
                  var listElementContent = [];
                  for (var k = 0; k < element.getElementsByTagName("list").item(i).getElementsByTagName("list-item").item(j).getElementsByTagName("p").length; k++) {
                    listElementContent[k] = new SlideElement("EL_CONTENT");
                    listElementContent[k].content(element.getElementsByTagName("list").item(i).getElementsByTagName("list-item").item(j).getElementsByTagName("p").item(k).innerHTML);
                  }
                  listElement[j].content(listElementContent);
                }
                list.content(listElement);
              }
              slideElements[frameIndex] = list;
              break;

            case "graphic":
              slideElements[frameIndex] = new SlideElement("IMAGE");
              slideElements[frameIndex].content(new Image(element.getElementsByTagName("image").item(0).attributes["xlink:href"].value));
              break;

            case "table":
              var table = new SlideElement("TABLEAU");
              var rows = [];
              for (var i = 0; i < element.getElementsByTagName("table-row").length; i++) {
                rows[i] = new SlideElement("LIGNE");
                var cellules = [];
                for(var j = 0; j < element.getElementsByTagName("table-row").item(i).getElementsByTagName("table-cell").length; j++){
                  cellules[j] = new SlideElement("CELLULE");
                  cellules[j].content(element.getElementsByTagName("table-row").item(i).getElementsByTagName("table-cell").item(j).getElementsByTagName("p").item(0).innerHTML);
                  //console.log();
                }
                rows[i].content(cellules);
              }
              table.content(rows);
              slideElements[frameIndex] = table;
              break;

            case "object":
              
              break;

            default:
              slideElements[frameIndex] = new SlideElement("WITHOUT_ClASS");
              break;
          }
        }else{
          
          if (element.getElementsByTagName("date").length > 0) {
            slideElements[frameIndex] = new SlideElement("DATE");
            var elementContent = []; 
            for (var i = 0; i < element.getElementsByTagName("date").length; i++) {
              elementContent = element.getElementsByTagName("date").item(i).innerHTML;
            }
            slideElements[frameIndex].content(elementContent);
          }else if(element.getElementsByTagName("author-name").length > 0){
            slideElements[frameIndex] = new SlideElement("AUTEUR");
            slideElements[frameIndex].content("Auteur");
          }else if(element.getElementsByTagName("table")){
            var table = new SlideElement("TABLEAU");
            var rows = [];
            for (var i = 0; i < element.getElementsByTagName("table-row").length; i++) {
              rows[i] = new SlideElement("LIGNE");
              var cellules = [];
              for(var j = 0; j < element.getElementsByTagName("table-row").item(i).getElementsByTagName("table-cell").length; j++){
                cellules[j] = new SlideElement("CELLULE");
                cellules[j].content(element.getElementsByTagName("table-row").item(i).getElementsByTagName("table-cell").item(j).getElementsByTagName("p").item(0).innerHTML);
              }
              rows[i].content(cellules);
            }
            table.content(rows);
            slideElements[frameIndex] = table;
          }
        }
      });
      mySlides[slideIndex] = new Slide(slideIndex+1,slideElements);
    });
    //console.log(mySlides);
    GenerateXML(mySlides);
  };
  
  // 
}

function GenerateXML(slides){
  var date;
  var titre;
  var sousTitre;
  var auteur;
  var contenu;
  for (var i = 0; i < slides[0]._slideElements.length; i++) {
    if (slides[0]._slideElements[i]._elementType == "DATE") {
      date = '<PIEDPAGE_DROIT>' + slides[0]._slideElements[i]._content + '</PIEDPAGE_DROIT>';
    }else if(slides[0]._slideElements[i]._elementType == "TITRE"){
      titre = '<TITRE>'+ slides[0]._slideElements[i]._content +'</TITRE>';
    }else if(slides[0]._slideElements[i]._elementType == "SOUS_TITRE"){
      sousTitre = '<SOUS_TITRE>'+ slides[0]._slideElements[i]._content +'</SOUS_TITRE>';
    }else if(slides[0]._slideElements[i]._elementType == "AUTEUR"){
      auteur = '<AUTEUR>'+ slides[0]._slideElements[i]._content +'</AUTEUR>';
    }
  }
 var eastPr =
          '<?xml version="1.0" encoding="utf-8"?>\
          <?xml-stylesheet href="EAST.xsl" type="text/xsl"?>\
          <EAST transition="burst">\
            <PREFERENCES>\
              <AFFICHAGE>\
                <POLICE_TEXTE font="Comic Sans MS"/>\
              </AFFICHAGE>\
            </PREFERENCES><LOGO_GAUCHE fichier="logo_univ.png" hauteur_SVG="50" largeur_SVG="50"/>\
            <PIEDPAGE_GAUCHE>\
              EAST\
            </PIEDPAGE_GAUCHE>' 
            + date +
            '<PAGE_TITRE>'
              + titre
              + sousTitre
              + auteur +
              '</PAGE_TITRE>';
  for (var i = 1; i < slides.length; i++) {
    titre = "TITRE";
    sousTitre = "SOUS_TITRE";
    contenu = "";
    for (var j = 0; j < slides[i]._slideElements.length; j++) {
      if(slides[i]._slideElements[j]._elementType == "LIST"){
        contenu += '<LISTE couleur_puce="green" type="square">';
        for (var k = 0; k < slides[i]._slideElements[j]._content.length; k++) {
          contenu += '<EL>';
          for (var l = 0; l < slides[i]._slideElements[j]._content[k]._content.length; l++) {
            contenu += slides[i]._slideElements[j]._content[k]._content[l]._content;
          }
          contenu += '</EL>';
        }
        contenu += '</LISTE>';
      }else if(slides[i]._slideElements[j]._elementType == "IMAGE"){
        //console.log("Slide : " + (i+1) + ", IMAGE : " + slides[i]._slideElements[j]._content._hrefLink);
        contenu = '<IMAGE fichier="' +  slides[i]._slideElements[j]._content._hrefLink +'" hauteur="50" largeur="50"></IMAGE>';
      }else if(slides[i]._slideElements[j]._elementType == "TITRE"){
        titre = slides[i]._slideElements[j]._content;
		sousTitre = slides[i]._slideElements[j]._content;
      }else if(slides[i]._slideElements[j]._elementType == "TABLEAU"){
        contenu += '<TABLEAU>';
        for (var k = 0; k < slides[i]._slideElements[j]._content.length; k++) {
          contenu += '<LT>';
          for (var l = 0; l < slides[i]._slideElements[j]._content[k]._content.length; l++) {
            contenu += '<CT>' + slides[i]._slideElements[j]._content[k]._content[l]._content + '</CT>';
          }
          contenu += '</LT>';
        }
        contenu += '</TABLEAU>';
      }
    }

    eastPr +=   '<PARTIE>\
                  <TITRE>'+ titre +'</TITRE>\
                  <SECTION>\
                  <TITRE>' + sousTitre + '</TITRE>' +
                  contenu +
                  '</SECTION>\
                  </PARTIE>';
  }
  eastPr +='</EAST>';
  //console.log(eastPr);
  download("LibreOfficeToEAST",eastPr);
}

function download(filename, eastPr) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:application/xml;charset=utf-8,' + encodeURIComponent(eastPr));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}