const globeElement =
document.getElementById("globeViz");



const globe =
Globe()(globeElement)



.globeImageUrl(
"https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
)



.backgroundColor(
"rgba(0,0,0,0)"
);



//
// auto rotation
//

globe.controls().autoRotate=true;

globe.controls().autoRotateSpeed=0.25;




//
// locations
//

const locations=[];


document
.querySelectorAll(".experience-item")
.forEach(item=>{


locations.push({

lat:Number(item.dataset.lat),

lng:Number(item.dataset.lng),

name:item.querySelector("h3").innerText


});


});





//
// markers
//

globe
.htmlElementsData(locations)

.htmlLat(d=>d.lat)

.htmlLng(d=>d.lng)


.htmlElement(d=>{


const el=document.createElement("div");


el.innerHTML="●";


el.style.color="#e63946";


el.style.fontSize="22px";


el.style.pointerEvents="none";


return el;


});






//
// hover interaction
//

document
.querySelectorAll(".experience-item")

.forEach(item=>{


item.addEventListener(
"mouseenter",
()=>{


const lat=
Number(item.dataset.lat);


const lng=
Number(item.dataset.lng);



globe.pointOfView(

{

lat:lat,

lng:lng,

altitude:1.7

},

1500


);



}

);



});





//
// resize
//

window.addEventListener(
"resize",
()=>{

globe.width(
globeElement.clientWidth
);

globe.height(
globeElement.clientHeight
);

}

);
