//*************************************************************************************************
// 프로그램 명 : BTracker ( Business Tracker 즉 업무트래킹 툴 )
// 브라우저 화면에서 즉석으로 프로그램 설계 및 ERD구성 및 브래인스토밍 또는 작업 구성 등등의 여러가지 작업을 할 수 있는 툴이다.
// 처음에는 ERD툴을 만들 목적으로 시작하였으나, 제작도중에 갑자기 지금과 같은 기능이 급히 필요한 관계로 즉석으로 지금과 같은 형태의 프로그램이 되었다.
// 제작자 : 손윤석(charves)
// 저작권 : 본 프로그램의 저작권은 현재 그다지 존재하지는 않으므로 본 소스를 활용하여 다른 용도로 사용하는데는 아무 지장없다.
//          다만, 본 프로그램을 임의로 수정하여, 자신이 마치 처음부터 만든것 마냥 욱이는 그런 양아치, 찌질이 짓은 안하길 바란다.
//         --> 현재까지는 상품화 하지 않은 상태이나, 만일 상품화하게 된다면, 상품화 하는 그 버전부터는 저작권이 다르게 작용할 것이다.
//
//*************************************************************************************************
// 제작 이력
//*************************************************************************************************
// 초기제작 : 2022년 04월26일
// 도중에 보완작업이 다수 있었음(....)
// 2022.06.15 - (연관선택추가)
// 2022.06.18 - (Group기능추가)
// 2022.06.25 - (미니맵추가)
// 2022.06.27 - 공통환경변수 캡슐화 (js파일이 다른 프로그램들과 같이 사용될 경우 내부적으로 사용되는 변수명의 상호 충돌을  미연에 방지)
// 2022.07.01 - (링크복사+JSON잡)
// 2022.07.04 - (Group연관선택 + 커서키로이동)
// 20
// 현재버전 : 2024.07.03 - BiCon (커넥터 걍 연결선을 이어주는 역할추가) + (개별선택, 그룹선택, 연결선택 구분)
//*************************************************************************************************


//*************************************************************************************************
// Base64 형식의 이미지 데이터를 다시 바이너리 이미지로 변환
// JSON파일에서 데이터를 읽어들일때 사용하면 되겠다.
//*************************************************************************************************
function Base64ToBlobImg(base64Img, imgType) {
  let binaryImg = atob(base64Img);
  let length = binaryImg.length;
  let uint8Array = new Uint8Array(length);
  for (var i = 0; i < length; i++) {
    uint8Array[i] = binaryImg.charCodeAt(i);
  }
  //var blob = new Blob([uint8Array], { type: 'image/png' });
  var blob = new Blob([uint8Array], { type: imgType });
  return blob;
}
//*************************************************************************************************


//*************************************************************************************************
// 바이너리 이미지 데이터를 Base64형태로 변환
// JSON파일로 저장할때 사용하면 되겠다.
//*************************************************************************************************
function BlobImgToBase64(blob, callback) {
  console.log(typeof blob);
  var reader = new FileReader();
  reader.onloadend = function() {
    var base64String = reader.result.split(',')[1];
    callback(base64String);
  };
  reader.readAsDataURL(blob);
}
//*************************************************************************************************


//*************************************************************************************************
// Image Object To Base64 String
//*************************************************************************************************
function convertImageToBase64(img){
  const canvs = document.createElement('canvas');
  canvs.width = img.width;
  canvs.height = img.height;
  const ctx = canvs.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const base64Data = canvs.toDataURL('image/png');
  return base64Data;
}
//*************************************************************************************************


//*************************************************************************************************
// Base64 String To Image Object ( 별도의 onload 처리가 필요하다. )
//*************************************************************************************************
function convertBase64ToImage(base64Data){
  const img = new Image();
  img.src = base64Data;
  return img;
}
//*************************************************************************************************


var SD_Env = {
  camX          : 0,
  camY          : 0,
  accentLineDif : '[',                                                      // 특정 라인이 해당 값으로 시작되면 액센트를 줘서 출력한다.
  accentColor   : '#fa391b',
  accentLineDif2: '*',
  accentColor2  : '#391bfa', 
  ctrlDown      : false,
  lineTypes     : { 'dashLine':[2,3], 
                    'solidLine':[]
                  },
  lineMode      : 'solidLine',
  BTrackCursor  : {'HVResize'  :'se-resize',
                   'HResize'   :'w-resize',
                   'MouseLink' :'pointer',
                   'Cross'     :'crosshair'
                  },
  selColor      : '#fa9664',
  curSearchNm   : "",
  curSearchId   : "",
  selMode       : 2,                                                        // 개별선택 = 1, 그룹선택 = 2, 연결선택 = 3
  isEditable    : false,
};


var MiniMapInfo = {
  rate : 1.0,
  screenSX : 0,
  screenSY : 0,
  screenWD : 0,
  screenHT : 0,
  cWidth   : 0,
  cHeight  : 0,
  minX     : 0,
  minY     : 0,
  drawScreenAngle : function(dc){
    dc.beginPath();
    dc.lineWidth = 2;
    dc.strokeStyle = '#EA5252';
    dc.moveTo(this.screenSX, this.screenSY);
    dc.strokeRect(this.screenSX, this.screenSY, this.screenWD, this.screenHT);

    // console.log("this.screenSX = " + this.screenSX + ", this.screenSY = " + this.screenSY);
    // console.log("this.screenWD = " + this.screenWD + ", this.screenHT = " + this.screenHT);
  }
};

//*************************************************************************************************
// 링크를 포함하여 링크로 연결된 모든 객체들을 선택한다.(그룹은 링크로 연결되지 못하므로 포함되지 못한다.)
//*************************************************************************************************
function fncRelSelectBox(keyId, selNodes, selLinks, Nodes, Links){
  if(selLinks.hasOwnProperty(keyId) || selNodes.hasOwnProperty(keyId)) return;
  selNodes[keyId] = Nodes[keyId];
  for(let nextKey in Links){
    if(selLinks.hasOwnProperty(nextKey)) continue;
    let keys = nextKey.split("_");
    if(keyId == keys[0]){
      selLinks[nextKey] = Links[nextKey];
      fncRelSelectBox(keys[1], selNodes, selLinks, Nodes, Links);
    }else if(keyId == keys[1]){
      selLinks[nextKey] = Links[nextKey];
      fncRelSelectBox(keys[0], selNodes, selLinks, Nodes, Links);
    }
  }
}
//*************************************************************************************************



//*************************************************************************************************
// 하위 객체들이 각종 이벤트에 반응하여 리턴하는 객체
//*************************************************************************************************
function EventCheckResult(){
  var rtn = {
    clsName  : null,    // Class Name
    vectInfo : null,    // Left, Top, Right, Bottom
    idxInfo  : null,    // 0, 1, 2, 3, 4
    idInfo   : null,    // Object ID
    dataInfo : null,    // Result Data
    msgInfo  : null,
    etcInfo  : null,
  };
  return rtn;
}
//*************************************************************************************************



//*************************************************************************************************
// 실제 메모리에 저장된 좌표값을 화면상으로 나타내기 위한 좌표로 변환(Draw시에 활용)
//*************************************************************************************************
function R2S_X(px){   return px - SD_Env.camX;}  
function R2S_Y(py){	  return py - SD_Env.camY;}
//*************************************************************************************************



//*************************************************************************************************
// 화면에 클릭 혹은 어떤 이벤트 발생시 해당 화면 좌표에 대한 현재 실제좌표값 변환(Mouse Event시에 활용)
//*************************************************************************************************
function S2R_X(px){   return px + SD_Env.camX;}
function S2R_Y(py){   return py + SD_Env.camY;}
//*************************************************************************************************



//*************************************************************************************************
// 화면(카메라) 가 움직이는것 처럼 보이게 하기 위한 카메라의 절대좌표 이동
//*************************************************************************************************
function moveScreen(x, y){
	SD_Env.camX = SD_Env.camX + x;
	SD_Env.camY = SD_Env.camY + y;
}
//*************************************************************************************************



//*************************************************************************************************
// 한점과 직선 사이의 거리를 구하는 함수
//*************************************************************************************************
function getPL_Dist(sx, sy, ex, ey, ax, ay){
  let area  = Math.abs((sx-ax)*(ey-ay) - (sy-ay)*(ex-ax));
  let ab    = Math.sqrt((sx-ex)*(sx-ex) + (sy-ey)*(sy-ey));
  //return Math.floor(area / ab);   // 내림
  //return Math.round(area / ab);   // 반올림
  return Math.ceil(area / ab);      // 올림
}
//*************************************************************************************************



//*************************************************************************************************
// 마른모(BiQuat Text출력)
//*************************************************************************************************
function drawTextBiQuat(dc, node) {

  //***************************************************************************
  // Text 를 , 구분자로 요리조리 장난질 ㅎ 
  // 이 관련한 UI는 HTML에서 알아서 표현해야 함
  // 엔진은 무조건 이런 구조로 동작한다~~ 이말씀 ^^
  //***************************************************************************
  // [0] : topJoin    - Text  : 목적(대상)
  // [1] : text               : 비교
  // [2] : leftJoin   - Text  : 결과(1)
  // [3] : rightJoin  - Text  : 결과(2)
  // [4] : bottomJoin - Text  : 결과(3)
  let textAr      = node.text.split(',');
  //***************************************************************************

  //***************************************************************************
  // text 출력
  //***************************************************************************
  let drX = R2S_X(node.sPT.px);
  let drY = R2S_Y(node.sPT.py) + 2;
  dc.textAlign    = "center";
  dc.textBaseline = "middle";
  dc.fillStyle    = '#101010';
  dc.font         = 'normal ' + node.drawFontSize + 'px ' + node.drawFontName;
  dc.fillText(textAr[1].trim(), drX, drY);
  //***************************************************************************


  //***************************************************************************
  // topJoin - Text 출력
  //***************************************************************************
  drX = R2S_X(node.topJoin.px) - 4;
  drY = R2S_Y(node.topJoin.py);
  dc.textAlign    = "right";
  dc.textBaseline = "bottom";
  dc.fillStyle    = '#101010';
  dc.font         = 'normal 12px ' + node.drawFontName;
  dc.fillText(textAr[0].trim(), drX, drY);
  //***************************************************************************


  //***************************************************************************
  // leftJoin - Text 출력
  //***************************************************************************
  drX = R2S_X(node.leftJoin.px) - 6;
  drY = R2S_Y(node.leftJoin.py) + 4;
  dc.textAlign    = "right";
  dc.textBaseline = "top";
  dc.fillStyle    = '#101010';
  dc.font         = 'normal 12px ' + node.drawFontName;
  dc.fillText(textAr[2].trim(), drX, drY);
  //***************************************************************************


  //***************************************************************************
  // bottomJoin - Text 출력
  //***************************************************************************
  drX = R2S_X(node.bottomJoin.px) + 4;
  drY = R2S_Y(node.bottomJoin.py);
  dc.textAlign    = "left";
  dc.textBaseline = "top";
  dc.fillStyle    = '#101010';
  dc.font         = 'normal 12px ' + node.drawFontName;
  dc.fillText(textAr[3].trim(), drX, drY);
  //***************************************************************************


  //***************************************************************************
  // rightJoin - Text 출력
  //***************************************************************************
  drX = R2S_X(node.rightJoin.px) + 4;
  drY = R2S_Y(node.rightJoin.py);
  dc.textAlign    = "left";
  dc.textBaseline = "bottom";
  dc.fillStyle    = '#101010';
  dc.font         = 'normal 12px ' + node.drawFontName;
  dc.fillText(textAr[4].trim(), drX, drY);
  //***************************************************************************
}
//*************************************************************************************************



//*************************************************************************************************
// 동그라미(BiCon Text출력) 무조건 첫글자 하나만 나오게 했다 ㅋㅋㅋㅋㅋ
//*************************************************************************************************
function drawTextBiCon(dc, node) {
  let drX = R2S_X(node.sPT.px);
  let drY = R2S_Y(node.sPT.py) + 15;
  dc.textAlign    = "center";
  dc.textBaseline = "bottom";
  let textAr      = node.text.substring(0, 1);
  dc.fillStyle    = '#419806';
  dc.font         = 'bold ' + node.drawFontSize + 'px ' + node.drawFontName;
  dc.fillText(textAr, drX, drY);
}
//*************************************************************************************************



//*************************************************************************************************
//  
//*************************************************************************************************
function drawTextBox(dc, node) {
  let drX = R2S_X(node.sPT.px) + 12;
  let drY = R2S_Y(node.sPT.py) + 12;
  var fontSize = parseFloat(dc.font);
  var currentY = drY;

  dc.textAlign = "left";
  dc.textBaseline = "top";

  let textAr = node.text.split('\n');
  for(let i=0;i<textAr.length;i++){
    if(textAr[i].startsWith(SD_Env.accentLineDif)) {
      dc.fillStyle = SD_Env.accentColor;
      dc.font = 'bold ' + node.drawFontSize + 'px ' + node.drawFontName;
    }else if(textAr[i].startsWith(SD_Env.accentLineDif2)){
      dc.fillStyle = SD_Env.accentColor2;
      dc.font = 'bold ' + node.drawFontSize + 'px ' + node.drawFontName;
    }else{
      dc.fillStyle = '#101010';
      dc.font = 'normal ' + node.drawFontSize + 'px ' + node.drawFontName;
    }

    if(dc.measureText(textAr[i]).width + 12 < node.size.width){
      dc.fillText(textAr[i], drX, currentY);
      currentY += fontSize*1.5;
    }else{
      let txlineN = '';
      let txlineO = '';
      for(let j=0; j<textAr[i].length; j++){
        txlineN += textAr[i][j];
        if(dc.measureText(txlineN).width + 12 < node.size.width){
          txlineO = txlineN;
        }else{
          dc.fillText(txlineO, drX, currentY);
          txlineN = '';
          txlineO = '';
          currentY += fontSize*1.5;
        }
      }
      if(txlineO != '') dc.fillText(txlineO, drX, currentY);
      currentY += fontSize*1.5;
    }
  }
}

//*************************************************************************************************



//*************************************************************************************************
// 포인트 객체(객체의 위치정보)
//*************************************************************************************************
function BasicPoint(x, y){
  var rtn = {
    px : x,
    py : y,
    copyFrom : function(pt){
      this.px = pt.px;
      this.py = pt.py;
    },
    checkPoint : function(cx, cy, gap){
      if(cx <= this.px + gap && cx >= this.px - gap && cy <= this.py + gap && cy >= this.py - gap){
        return 'pointer';
      }
      return null;
    },
  };
  return rtn;
}
//*************************************************************************************************



//*************************************************************************************************
// 사이즈 객체(객체의 크기 정보)
//*************************************************************************************************
function BasicSize(w, h){
  var rtn = {
    width      : w,
    height     : h,
    getCenterPT : function(pt){
      let center = new BasicPoint(pt.px, pt.py);
      center.px = pt.px + (this.width/2);
      center.py = pt.py + (this.height/2);
      return center;
    },
    getCenterX : function(pt){ return pt.px + (this.width/2);  },           // 객체의 x축 가운데 지점(BasicPoint에 두는게 맞으려나? 여기 두는게 맞으려나?)
    getCenterY : function(pt){ return pt.py + (this.height/2); },            // 객체의 y축 가운데 지점(BasicPoint에 두는게 맞으려나? 여기 두는게 맞으려나?)
    getEndPT : function(pt){
      let endp = new BasicPoint(pt.px, pt.py);
      endp.px = pt.px + this.width;
      endp.py = pt.py + this.height;
      return endp;
    },
    getEndX    : function(pt){ return pt.px + this.width;   },  //
    getEndY    : function(pt){ return pt.py + this.height;  },  //
    copyFrom   : function(sz){
      this.width = sz.width;
      this.height = sz.height;
    },
  };
  return rtn;
}
//*************************************************************************************************



//*************************************************************************************************
// 그룹 ( 여러 항목들을 묶어 주는 일종의 영역 표시 )
//*************************************************************************************************
function BiGroup() {
  var rtn = {
    id              : '',
    sPT             : null,
    size            : null,
    bodyColor       : '',
    edgeColor       : '#969696',
    oPT             : null,                                                 // 이동시에 예전 위치값을 가지고 있다가 취소되면 제자리로 돌아갈 수 있게 하기 위한 의도로 사용된다.
    text            : '',
    widthResiable   : true,
    heightResiable  : true,
    drawFontSize    : 20,
    drawFontName    : ' Arial',
    checkCursorPoint : function (x, y, gap){
      x = S2R_X(x);
      y = S2R_Y(y);
      if(this.widthResiable){
        if(this.heightResiable){
          if(y >= this.sPT.py+this.size.height-gap &&
             y <= this.sPT.py+this.size.height+gap &&
             x >= this.sPT.px+this.size.width-gap &&
             x <= this.sPT.px+this.size.width+gap){
              let eventCheckInfo = new EventCheckResult();
              eventCheckInfo.clsName = 'string';
              eventCheckInfo.dataInfo = SD_Env.BTrackCursor['HVResize'];
              return eventCheckInfo;
          }
          return null;
        }else{
          if(y >= this.sPT.py &&
             y <= this.sPT.py+this.size.height &&
             x >= this.sPT.px+this.size.width-gap &&
             x <= this.sPT.px+this.size.width+gap){
              let eventCheckInfo = new EventCheckResult();
              eventCheckInfo.clsName = 'string';
              eventCheckInfo.dataInfo = SD_Env.BTrackCursor['HResize'];
              return eventCheckInfo;
          }
          return null;
        }
      }
    },
    draw : function(dc, isSelected){
      let drX = R2S_X(this.sPT.px);
      let drY = R2S_Y(this.sPT.py);
      dc.beginPath();
      dc.fillStyle = this.bodyColor;
      dc.fillRect(drX, drY, this.size.width, 40);

      // 일반의 경우엔 this.edgeColor, 선택되었을때는 selColor ==> 바깥 경계선만 다르게 표시한다.
      if(isSelected){
        dc.strokeStyle = SD_Env.selColor;
        dc.lineWidth = 5;
        dc.strokeRect(drX, drY, this.size.width, this.size.height);
      }else{  
        dc.strokeStyle = this.edgeColor;
        dc.lineWidth = 3;
        dc.strokeRect(drX, drY, this.size.width, this.size.height);
      }

      // resize 하기 위한 표식을 표시
      dc.fillStyle = '#c83232';
      dc.fillRect(drX + this.size.width-1 , drY + this.size.height-10, 3, 11);
      dc.fillRect(drX + this.size.width-10, drY + this.size.height-1, 11, 3);
      
      // 텍스트 표시
      dc.fillStyle = '#101010';
      dc.font = this.drawFontSize + 'px ' + this.drawFontName;
      drawTextBox(dc, this);
    },
    select : function (px, py){
      px = S2R_X(px);
      py = S2R_Y(py);
      if(this.sPT.px > px)                  return null;
      if(this.sPT.py > py)                  return null;
      if(this.size.getEndX(this.sPT) < px)  return null;
      if((this.sPT.py + 40) < py)           return null;
      //if(this.size.getEndY(this.sPT) < py)  return null;
      let eventCheckInfo      = new EventCheckResult();
      eventCheckInfo.clsName  = 'BiGroup';
      eventCheckInfo.dataInfo = this.id;
      return eventCheckInfo;
    },
    moveTo : function (px, py){
      this.sPT.px = this.oPT.px + px;
      this.sPT.py = this.oPT.py + py;
      this.oPT.copyFrom(this.sPT);
    },
    moveView : function (px, py){
      this.sPT.px = this.oPT.px + px;
      this.sPT.py = this.oPT.py + py;
    },
  };
  return rtn;
}
//*************************************************************************************************



//*************************************************************************************************
// 노드 ( 항목을 표현하는 기본 단위 )
//*************************************************************************************************
function BiBox() {
  var rtn = {
    id              : '',
    sPT             : null,
    size            : null,
    edgeLineWidth   : 1,
    bodyColor       : '',
    edgeColor       : '#969696',
    oPT             : null,                                                 // 이동시에 예전 위치값을 가지고 있다가 취소되면 제자리로 돌아갈 수 있게 하기 위한 의도로 사용된다.
    text            : '',
    widthResiable   : true,
    heightResiable  : true,
    drawFontSize    : 20,
    drawFontName    : ' Arial',
    leftJoin        : null,
    rightJoin       : null,
    topJoin         : null,
    bottomJoin      : null,
    img             : null,                   //  이미지
    con             : null,                   //  커넥터
    quat            : null,                   //  분기

    checkCursorPoint : function (x, y, gap){
      x = S2R_X(x);
      y = S2R_Y(y);
      if(this.leftJoin.checkPoint(x, y, gap)    != null) {
        let eventCheckInfo = new EventCheckResult();
        eventCheckInfo.clsName  = 'BasicPoint';
        eventCheckInfo.vectInfo = 'leftJoin';
        eventCheckInfo.dataInfo = this.leftJoin;
        return eventCheckInfo;
      }
      if(this.rightJoin.checkPoint(x, y, gap)   != null) {
        let eventCheckInfo = new EventCheckResult();
        eventCheckInfo.clsName  = 'BasicPoint';
        eventCheckInfo.vectInfo = 'rightJoin';
        eventCheckInfo.dataInfo = this.rightJoin;
        return eventCheckInfo;
      }
      if(this.topJoin.checkPoint(x, y, gap)     != null) {
        let eventCheckInfo = new EventCheckResult();
        eventCheckInfo.clsName  = 'BasicPoint';
        eventCheckInfo.vectInfo = 'topJoin';
        eventCheckInfo.dataInfo = this.topJoin;
        return eventCheckInfo;
      }
      if(this.bottomJoin.checkPoint(x, y, gap)  != null) {
        let eventCheckInfo = new EventCheckResult();
        eventCheckInfo.clsName  = 'BasicPoint';
        eventCheckInfo.vectInfo = 'bottomJoin';
        eventCheckInfo.dataInfo = this.bottomJoin;
        return eventCheckInfo;
      }
      if(this.widthResiable){
        if(this.heightResiable){
          if(y >= this.sPT.py+this.size.height-gap &&
             y <= this.sPT.py+this.size.height+gap &&
             x >= this.sPT.px+this.size.width-gap &&
             x <= this.sPT.px+this.size.width+gap){
              let eventCheckInfo = new EventCheckResult();
              eventCheckInfo.clsName = 'string';
              eventCheckInfo.dataInfo = SD_Env.BTrackCursor['HVResize'];
              return eventCheckInfo;
          }
          return null;
        }else{
          if(y >= this.sPT.py &&
             y <= this.sPT.py+this.size.height &&
             x >= this.sPT.px+this.size.width-gap &&
             x <= this.sPT.px+this.size.width+gap){
              let eventCheckInfo = new EventCheckResult();
              eventCheckInfo.clsName = 'string';
              eventCheckInfo.dataInfo = SD_Env.BTrackCursor['HResize'];
              return eventCheckInfo;
          }
          return null;
        }
      }
    },
    draw : function(dc, isSelected){
      let drX = R2S_X(this.sPT.px);
      let drY = R2S_Y(this.sPT.py);
      
      dc.beginPath();
      if(this.con){
        if(isSelected){
          dc.strokeStyle = SD_Env.selColor;
          dc.lineWidth = 8;
        }else{
          dc.strokeStyle = this.edgeColor;
          dc.lineWidth = 5;
        }
        dc.moveTo(drX, drY);
        dc.arc(drX, drY, this.size.width, 0, 2 * Math.PI);
        dc.stroke();
        dc.fillStyle = this.bodyColor;
        dc.fill();
        
        dc.fillStyle = '#101010';
        dc.font = this.drawFontSize + 'px ' + this.drawFontName;
        drawTextBiCon(dc, this);

        dc.beginPath();
        dc.fillStyle = '#c83232';
        dc.moveTo(R2S_X(this.leftJoin.px)    , R2S_Y(this.leftJoin.py));
        dc.arc(R2S_X(this.leftJoin.px)       , R2S_Y(this.leftJoin.py)    , 3, 0, 2 * Math.PI);
        dc.fill();
        dc.moveTo(R2S_X(this.rightJoin.px)   , R2S_Y(this.rightJoin.py));
        dc.arc(R2S_X(this.rightJoin.px)      , R2S_Y(this.rightJoin.py)   , 3, 0, 2 * Math.PI);
        dc.fill();
        dc.moveTo(R2S_X(this.topJoin.px)     , R2S_Y(this.topJoin.py));
        dc.arc(R2S_X(this.topJoin.px)        , R2S_Y(this.topJoin.py)     , 3, 0, 2 * Math.PI);
        dc.fill();
        dc.moveTo(R2S_X(this.bottomJoin.px)  , R2S_Y(this.bottomJoin.py));
        dc.arc(R2S_X(this.bottomJoin.px)     , R2S_Y(this.bottomJoin.py)  , 3, 0, 2 * Math.PI);
        dc.fill();
      }else if(this.quat){
        if(isSelected){
          dc.strokeStyle = SD_Env.selColor;
          dc.lineWidth = 8;
        }else{
          dc.strokeStyle = this.edgeColor;
          dc.lineWidth = 5;
        }
        dc.moveTo(R2S_X(this.topJoin.px)    , R2S_Y(this.topJoin.py   ));
        dc.lineTo(R2S_X(this.leftJoin.px)   , R2S_Y(this.leftJoin.py  ));
        dc.lineTo(R2S_X(this.bottomJoin.px) , R2S_Y(this.bottomJoin.py));
        dc.lineTo(R2S_X(this.rightJoin.px)  , R2S_Y(this.rightJoin.py ));
        dc.lineTo(R2S_X(this.topJoin.px)    , R2S_Y(this.topJoin.py   ));
        dc.stroke();
        dc.fillStyle = this.bodyColor;
        dc.fill();

        // resize 하기 위한 표식을 표시
        dc.fillStyle = '#c83232';
        dc.fillRect(drX + this.size.width-1 , drY + this.size.height-10, 3, 11);
        dc.fillRect(drX + this.size.width-10, drY + this.size.height-1, 11, 3);

        dc.fillStyle = '#101010';
        dc.font = this.drawFontSize + 'px ' + this.drawFontName;
        drawTextBiQuat(dc, this);

        dc.beginPath();
        dc.fillStyle = '#c83232';
        dc.moveTo(R2S_X(this.leftJoin.px)    , R2S_Y(this.leftJoin.py));
        dc.arc(R2S_X(this.leftJoin.px)       , R2S_Y(this.leftJoin.py)    , 3, 0, 2 * Math.PI);
        dc.fill();
        dc.moveTo(R2S_X(this.rightJoin.px)   , R2S_Y(this.rightJoin.py));
        dc.arc(R2S_X(this.rightJoin.px)      , R2S_Y(this.rightJoin.py)   , 3, 0, 2 * Math.PI);
        dc.fill();
        dc.moveTo(R2S_X(this.topJoin.px)     , R2S_Y(this.topJoin.py));
        dc.arc(R2S_X(this.topJoin.px)        , R2S_Y(this.topJoin.py)     , 3, 0, 2 * Math.PI);
        dc.fill();
        dc.moveTo(R2S_X(this.bottomJoin.px)  , R2S_Y(this.bottomJoin.py));
        dc.arc(R2S_X(this.bottomJoin.px)     , R2S_Y(this.bottomJoin.py)  , 3, 0, 2 * Math.PI);
        dc.fill();
      }else{
        if(this.img != null){
          dc.drawImage(this.img, drX, drY, this.size.width, this.size.height);
        }else{
          dc.fillStyle = this.bodyColor;
          dc.fillRect(drX, drY, this.size.width, this.size.height);
        }
        
        if(isSelected){
          dc.strokeStyle = SD_Env.selColor;
          dc.lineWidth = 5;
          dc.strokeRect(drX, drY, this.size.width, this.size.height);
        }else{  
          dc.strokeStyle = this.edgeColor;
          dc.lineWidth = 3;
          dc.strokeRect(drX, drY, this.size.width, this.size.height);
        }
  
        // resize 하기 위한 표식을 표시
        dc.fillStyle = '#c83232';
        dc.fillRect(drX + this.size.width-1 , drY + this.size.height-10, 3, 11);
        dc.fillRect(drX + this.size.width-10, drY + this.size.height-1, 11, 3);
        
        // 텍스트 표시
        dc.fillStyle = '#101010';
        dc.font = this.drawFontSize + 'px ' + this.drawFontName;
        drawTextBox(dc, this);
  
        // 상하좌우 연결꼭지 표시
        dc.fillStyle = '#c83232';
        dc.moveTo(R2S_X(this.leftJoin.px)    , R2S_Y(this.leftJoin.py));
        dc.arc(R2S_X(this.leftJoin.px)       , R2S_Y(this.leftJoin.py)    , 3, 0, 2 * Math.PI);
        dc.fill();
        dc.moveTo(R2S_X(this.rightJoin.px)   , R2S_Y(this.rightJoin.py));
        dc.arc(R2S_X(this.rightJoin.px)      , R2S_Y(this.rightJoin.py)   , 3, 0, 2 * Math.PI);
        dc.fill();
        dc.moveTo(R2S_X(this.topJoin.px)     , R2S_Y(this.topJoin.py));
        dc.arc(R2S_X(this.topJoin.px)        , R2S_Y(this.topJoin.py)     , 3, 0, 2 * Math.PI);
        dc.fill();
        dc.moveTo(R2S_X(this.bottomJoin.px)  , R2S_Y(this.bottomJoin.py));
        dc.arc(R2S_X(this.bottomJoin.px)     , R2S_Y(this.bottomJoin.py)  , 3, 0, 2 * Math.PI);
        dc.fill();
      }
    },
    select : function (px, py){
      px = S2R_X(px);
      py = S2R_Y(py);
      if(this.con){
        if((this.sPT.px-this.size.width) > px)  return null;
        if((this.sPT.py-this.size.width) > py)  return null;
        if((this.sPT.px+this.size.width) < px)  return null;
        if((this.sPT.py+this.size.width) < py)  return null;
        // 원 영역 포함 여부의 공식 : 점과 점간의 거리가 반지름보다 작거나 같으면 영역에 포함된다.
        let w = Math.abs(this.sPT.px - px);
        let h = Math.abs(this.sPT.py - py);
        let r = this.size.width;
        if(r*r >= (w*w + h*h)){
// console.log("rr = " + r*r);
// console.log("ww = " + w*w);
// console.log("hh = " + h*h);
          let eventCheckInfo = new EventCheckResult();
          eventCheckInfo.clsName = 'BiCon';
          eventCheckInfo.dataInfo = this.id;
          return eventCheckInfo;
        }
      }else if(this.quat){
        if(this.sPT.px-this.size.width > px)    return null;
        if(this.sPT.py-this.size.height > py)   return null;
        if(this.sPT.px+this.size.width < px)    return null;
        if(this.sPT.py+this.size.height < py)   return null;
        // 마른모 영역 포함 여부의 공식
        // 마른모 중심에서 가로절대거리/(가로크기/2) + 세로절대거리/(세로크기/2) 가 1보다 작거나 같으면 포함된다.
        // 마른모 중심이 0이고 찍힌 점의 좌표가 x, y 일 경우
        // |x|/this.size.width + |y|/this.size.height <= 1
        let w = Math.abs(this.sPT.px - px);
        let h = Math.abs(this.sPT.py - py);
        let hap = parseFloat(w / (this.size.width) + h / (this.size.height));
        if(hap <= 1) {
          let eventCheckInfo = new EventCheckResult();
          eventCheckInfo.clsName  = 'BiQuat';
          eventCheckInfo.dataInfo = this.id;
          return eventCheckInfo;
        }
        return null;
      }else{
        if(this.sPT.px > px)  return null;
        if(this.sPT.py > py)  return null;
        if(this.size.getEndX(this.sPT) < px)  return null;
        if(this.size.getEndY(this.sPT) < py)  return null;
        let eventCheckInfo = new EventCheckResult();
        eventCheckInfo.clsName  = 'BiBox';
        eventCheckInfo.dataInfo = this.id;
        return eventCheckInfo;
      }
    },
    moveTo : function (px, py){
      this.sPT.px = this.oPT.px + px;
      this.sPT.py = this.oPT.py + py;
      this.oPT.copyFrom(this.sPT);
      this.refresh();
    },
    moveView : function (px, py){
      this.sPT.px = this.oPT.px + px;
      this.sPT.py = this.oPT.py + py;
      this.refresh();
    },
    getCenterPT : function(){
      if (this.con) return this.sPT;
      else return size.getCenterPT(sPT);
    },
    refresh : function(){
      let drX = this.sPT.px;
      let drY = this.sPT.py;
      
      if(this.con){
        this.leftJoin.px    = drX - this.size.width;
        this.leftJoin.py    = drY;
        this.rightJoin.px   = drX + this.size.width
        this.rightJoin.py   = drY;
        this.topJoin.px     = drX;
        this.topJoin.py     = drY - this.size.width;
        this.bottomJoin.px  = drX
        this.bottomJoin.py  = drY + this.size.width;
      }else if(this.quat){
        this.leftJoin.px    = drX - this.size.width;
        this.leftJoin.py    = drY;
        this.rightJoin.px   = drX + this.size.width
        this.rightJoin.py   = drY;
        this.topJoin.px     = drX;
        this.topJoin.py     = drY - this.size.height;
        this.bottomJoin.px  = drX
        this.bottomJoin.py  = drY + this.size.height;
      }else{
        this.leftJoin.px    = drX;
        this.leftJoin.py    = drY + this.size.height/2;
        this.rightJoin.px   = drX + this.size.width;
        this.rightJoin.py   = drY + this.size.height/2;
        this.topJoin.px     = drX + this.size.width/2;
        this.topJoin.py     = drY; 
        this.bottomJoin.px  = drX + this.size.width/2;
        this.bottomJoin.py  = drY + this.size.height;
      }
    }
  };
  return rtn;
}
//*************************************************************************************************



//*************************************************************************************************
// 연결선을 표시하는 객체
//*************************************************************************************************
function BiLink(){
  var rtn = {
    id      : '',
    sPT     : null,                                                         // 좌표계에서 표시되는 시작점
    ePT     : null,                                                         // 좌표계에서 표시되는 종료점
    sName   : '',                                                           // 연결시작점의 노드명
    eName   : '',                                                           // 연결종료점의 노드명
    sVector : null,                                                         // Node의 연결부위 (left, top, bottom, right)
    eVector : null,                                                         // Node의 연결부위 (left, top, bottom, right)
    type    : 'solidLine',                                                  // 직선 = 'solidLine' [] (SOLID), 점선 = 'dashLine' : [2,3]
    
    draw    : function(dc, isSelected) {
      if(this.sPT != null && this.ePT != null){
        dc.beginPath();
        dc.setLineDash(SD_Env.lineTypes[this.type]);
        if(isSelected){
          dc.lineWidth    = 4;
          dc.strokeStyle  = SD_Env.selColor;
        }else{
          dc.lineWidth    = 3;
          dc.strokeStyle  = '#0a0ac8';
        }
        dc.moveTo(R2S_X(this.sPT.px), R2S_Y(this.sPT.py));
        dc.lineTo(R2S_X(this.ePT.px), R2S_Y(this.ePT.py));
        dc.stroke();
        dc.setLineDash(SD_Env.lineTypes['solidLine']);                      // 복원시켜주기
        dc.beginPath();
        dc.fillStyle    = '#0a0ac8';
        dc.arc(R2S_X(this.ePT.px), R2S_Y(this.ePT.py), 5, 0, 2 * Math.PI);
        dc.fill();
      }
    },
    select : function(px, py, gap){
      px = S2R_X(px);
      py = S2R_Y(py);

      let sx = this.sPT.px;
      let ex = this.ePT.px;
      let sy = this.sPT.py;
      let ey = this.ePT.py;
      if(sx > ex){
        sx = this.ePT.px;
        ex = this.sPT.px;
      }
      if(sy > ey){
        sy = this.ePT.py;
        ey = this.sPT.py;
      }
      if(px <= sx - gap) return null;
      if(px >= ex + gap) return null;
      if(py <= sy - gap) return null;
      if(py >= ey + gap) return null;
      let dist = getPL_Dist(this.sPT.px, this.sPT.py, this.ePT.px, this.ePT.py, px, py);

      if(dist <= gap){
        let eventCheckInfo = new EventCheckResult();
        eventCheckInfo.clsName  = 'BiLink';
        eventCheckInfo.dataInfo = this.id;
        return eventCheckInfo;
      }else{
        return null;
      }
    },
  };
  return rtn;
}
//*************************************************************************************************



//*************************************************************************************************
// 디자이너 객체
//*************************************************************************************************
function ScreenDesigner(canvasID){
  var canvas = document.getElementById(canvasID);
  var rtn = {
    maxSeq          : 0,
    canvasObj       : canvas,
    dc              : canvas.getContext('2d'),
    Groups          : {},
    selGroups       : {},
    Nodes           : {},
    selNodes        : {},
    Links           : {},
    selLinks        : {},
    Images          : {},
    selImages       : {},
    vLink           : null,
    curNodeId       : null,
    cursorName      : null,
    isMouseDown     : false,
    mouseButton     : -1,
    firstX          : 0,                                                    // 마우스 다운으로 특정 오브젝트가 선택되면 그 오브젝트를 제대로
    firstY          : 0,
    grid            : 20,
    gridColor       : '#dcdcdc',
    gridLineWidth   : 0.5,
    snap            : 20,
    resizeMouseGap  : 4,
    openBiEditPop   : null,
    
    Rellys          : {},
    selRellys       : [],

    //*********************************************************************************************
    // 그룹 추가 함수
    //*********************************************************************************************
    addBiGroup : function (boxTxt, x, y, w, h, color, groupId) {
      if(groupId == null) {
        this.maxSeq++;
        groupId = this.maxSeq.toString(36);
      }else{
        if(Number.parseInt(groupId, 36) > this.maxSeq) this.maxSeq = Number.parseInt(groupId, 36) + 1;
      }
      let returnValue = new EventCheckResult();
      if(this.Nodes.hasOwnProperty(groupId)) {
        returnValue.clsName = "addBiGroup_Error";
        returnValue.msgInfo = "이미 존재하는 ID입니다";
        return returnValue;
      }
      let newGroup        = new BiGroup();
      newGroup.id         = groupId;
      newGroup.sPT        = new BasicPoint(x, y);
      newGroup.size       = new BasicSize(w, h);
      newGroup.bodyColor  = color;
      newGroup.oPT        = new BasicPoint(x, y);                             // 이동시에 예전 위치값을 가지고 있다가 취소되면 제자리로 돌아갈 수 있게 하기 위한 의도로 사용된다.
      newGroup.text       = boxTxt;
      
      this.Groups[groupId] = newGroup;
      returnValue.clsName = "addBiGroup_Success";
      returnValue.dataInfo = this.Groups[groupId];
      this.maxSql = Number.parseInt(groupId, 36);
      return returnValue;
    },
    //*********************************************************************************************


        
    //*********************************************************************************************
    // 노드 추가 함수
    //*********************************************************************************************
    addBiBox : function (boxTxt, x, y, w, h, color, boxId){
      if(boxId == null) {
        this.maxSeq++;
        boxId = this.maxSeq.toString(36);
      }else{
        if(Number.parseInt(boxId, 36) > this.maxSeq) this.maxSeq = Number.parseInt(boxId, 36) + 1;
      }
      let returnValue = new EventCheckResult();
      if(this.Nodes.hasOwnProperty(boxId)) {
        returnValue.clsName = "addBiBox_Error";
        returnValue.msgInfo = "이미 존재하는 ID입니다";
        return returnValue;
      }
      let newBox        = new BiBox();
      newBox.id         = boxId;
      newBox.sPT        = new BasicPoint(x, y);
      newBox.size       = new BasicSize(w, h);
      newBox.bodyColor  = color;
      newBox.oPT        = new BasicPoint(x, y);                             // 이동시에 예전 위치값을 가지고 있다가 취소되면 제자리로 돌아갈 수 있게 하기 위한 의도로 사용된다.
      newBox.text       = boxTxt;
      newBox.leftJoin   = new BasicPoint(x    , y+h/2 );
      newBox.rightJoin  = new BasicPoint(x+w  , y+h/2 );
      newBox.topJoin    = new BasicPoint(x+w/2, y     );
      newBox.bottomJoin = new BasicPoint(x+w/2, y+h   );
      this.Nodes[boxId] = newBox;
      returnValue.clsName = "addBiBox_Success";
      returnValue.dataInfo = this.Nodes[boxId];
      this.maxSql = Number.parseInt(boxId, 36);
      return returnValue;
    },
    //*********************************************************************************************


    //*********************************************************************************************
    //
    //*********************************************************************************************
    addBiCon : function (boxTxt, x,y,r,color, boxId){
      if(boxId == null) {
        this.maxSeq++;
        boxId = this.maxSeq.toString(36);
      }else{
        if(Number.parseInt(boxId, 36) > this.maxSeq) this.maxSeq = Number.parseInt(boxId, 36) + 1;
      }
      let returnValue = new EventCheckResult();
      if(this.Nodes.hasOwnProperty(boxId)) {
        returnValue.clsName = "addBiCon_Error";
        returnValue.msgInfo = "이미 존재하는 ID입니다";
        return returnValue;
      }
      if(boxTxt){
        boxTxt.substring(0, 1);
      }else{
        boxTxt = '';
      }
      let newCon        = new BiBox();
      newCon.id         = boxId;
      newCon.sPT        = new BasicPoint(x, y);
      newCon.size       = new BasicSize(r, r);
      newCon.bodyColor  = color;
      newCon.oPT        = new BasicPoint(x, y);                             // 이동시에 예전 위치값을 가지고 있다가 취소되면 제자리로 돌아갈 수 있게 하기 위한 의도로 사용된다.
      newCon.text       = boxTxt;
      newCon.leftJoin   = new BasicPoint(x-r, y  );
      newCon.rightJoin  = new BasicPoint(x+r, y  );
      newCon.topJoin    = new BasicPoint(x  , y-r);
      newCon.bottomJoin = new BasicPoint(x  , y+r);
      newCon.widthResiable = false;
      newCon.heightResiable = false;
      newCon.drawFontSize = 25;
      newCon.drawFontName = 'Arial Black';
      newCon.con        = "Y";
      this.Nodes[boxId] = newCon;
      returnValue.clsName = "addBiCon_Success";
      returnValue.dataInfo = this.Nodes[boxId];
      this.maxSql = Number.parseInt(boxId, 36);
      return returnValue;
    },
    //*********************************************************************************************


    //*********************************************************************************************
    //
    //*********************************************************************************************
    addBiQuat : function (boxTxt, x,y,w,h,color, boxId){
      if(boxId == null) {
        this.maxSeq++;
        boxId = this.maxSeq.toString(36);
      }else{
        if(Number.parseInt(boxId, 36) > this.maxSeq) this.maxSeq = Number.parseInt(boxId, 36) + 1;
      }
      let returnValue = new EventCheckResult();
      if(this.Nodes.hasOwnProperty(boxId)) {
        returnValue.clsName = "addBiQuat_Error";
        returnValue.msgInfo = "이미 존재하는 ID입니다";
        return returnValue;
      }
      let newQuat           = new BiBox();
      newQuat.id            = boxId;
      newQuat.sPT           = new BasicPoint(x, y);
      newQuat.size          = new BasicSize(w, h);
      newQuat.bodyColor     = color;
      newQuat.oPT           = new BasicPoint(x, y);                             // 이동시에 예전 위치값을 가지고 있다가 취소되면 제자리로 돌아갈 수 있게 하기 위한 의도로 사용된다.
      newQuat.text          = boxTxt;
      newQuat.leftJoin      = new BasicPoint(x-w, y  );
      newQuat.rightJoin     = new BasicPoint(x+w, y  );
      newQuat.topJoin       = new BasicPoint(x  , y-h);
      newQuat.bottomJoin    = new BasicPoint(x  , y+h);
      newQuat.widthResiable   = true;
      newQuat.heightResiable  = true;
      newQuat.quat          = "Y";
      this.Nodes[boxId]     = newQuat;
      returnValue.clsName   = "addBiQuat_Success";
      returnValue.dataInfo  = this.Nodes[boxId];
      this.maxSql           = Number.parseInt(boxId, 36);
      return returnValue;
    },
    //*********************************************************************************************


    //*********************************************************************************************
    //
    //*********************************************************************************************
    addBiImage : function(imageData, x,y,w,h,boxId){

      if(boxId == null){
        this.maxSeq++;
        boxId = this.maxSeq.toString(36);
      }else{
        if(Number.parseInt(boxId, 36) > this.maxSeq) this.maxSeq = Number.parseInt(boxId, 36) + 1;
      }
      let returnValue = new EventCheckResult();
      if(this.Images.hasOwnProperty(boxId)){
        returnValue.clsName = "addBiImage_Error";
        returnValue.msgInfo = "이미 존재하는 ID입니다";
        return returnValue;
      }
      let newImage        = new BiBox();
      newImage.id         = boxId;
      newImage.img        = imageData;
      newImage.sPT        = new BasicPoint(x, y);
      newImage.size       = new BasicSize(w, h);
      newImage.oPT        = new BasicPoint(x, y);                             // 이동시에 예전 위치값을 가지고 있다가 취소되면 제자리로 돌아갈 수 있게 하기 위한 의도로 사용된다.
      newImage.leftJoin   = new BasicPoint(x    , y+h/2 );
      newImage.rightJoin  = new BasicPoint(x+w  , y+h/2 );
      newImage.topJoin    = new BasicPoint(x+w/2, y     );
      newImage.bottomJoin = new BasicPoint(x+w/2, y+h   );
      this.Nodes[boxId]   = newImage;

      let $dc = this.dc;                                                      // 이부분을 추가한 이유는 이미지가 로딩되는 동안의 시간이 필요한데, 프로그램은 그대로 갈 길을 가 버린다.
      imageData.onload = function(){                                          // 그리고 나중에 DrawAll()을 하더라도 이미 그 시점 이전에 로딩이 다 됬다는 보장이 없다.
        newImage.draw($dc, false);                                            // 그런 이유로 로딩이 끝나고 나서도 이미지가 화면에 안보이고, 마우스로 클릭해야만 보이는 현상이 발생한다.
      }                                                                       // 이에 이 부분의 소스를 추가하여 나름 최적화 하듯히 화면에 그림을 자연스럽게 그리도록 하였다.

      returnValue.clsName = "addBiImg_Success";
      returnValue.dataInfo = this.Nodes[boxId];
      this.maxSql = Number.parseInt(boxId, 36);
      return returnValue;
    },
    //*********************************************************************************************


    //*********************************************************************************************
    // BiBox 하나를 복재를 한다.
    //*********************************************************************************************
    copyBiBox : function (oldId, gap){
        let oldNode = this.Nodes[oldId];

        let rtnVal = null;
        if(oldNode.hasOwnProperty('img') && oldNode.img != null){
          rtnVal  = this.addBiImage(oldNode.img
                  , oldNode.sPT.px     , oldNode.sPT.py
                  , oldNode.size.width , oldNode.size.height
                  , null);
        }else if(oldNode.con){
          //addBiCon : function (x,y,r,color, boxId){
          rtnVal  = this.addBiCon(oldNode.text
                  , oldNode.sPT.px
                  , oldNode.sPT.py
                  , oldNode.size.width
                  , oldNode.bodyColor  
                  , null);
        }else if(oldNode.quat){
          //addBiQuat : function (boxTxt, x,y,r,color, boxId){
          rtnVal  = this.addBiQuat(oldNode.text
                  , oldNode.sPT.px
                  , oldNode.sPT.py
                  , oldNode.size.width
                  , oldNode.size.height
                  , oldNode.bodyColor 
                  , null);
          //gap = gap + gap + 20;
        }else{
          rtnVal  = this.addBiBox(oldNode.text
                  , oldNode.sPT.px     
                  , oldNode.sPT.py
                  , oldNode.size.width 
                  , oldNode.size.height
                  , oldNode.bodyColor  
                  , null);
        }
        // let rtnVal  = this.addBiBox(oldNode.text
        //                           , oldNode.sPT.px     , oldNode.sPT.py
        //                           , oldNode.size.width , oldNode.size.height
        //                           , oldNode.bodyColor  , null);
        rtnVal.dataInfo.sPT.px += gap;
        rtnVal.dataInfo.sPT.py += gap;
        rtnVal.dataInfo.oPT.px += gap;
        rtnVal.dataInfo.oPT.py += gap;
        rtnVal.dataInfo.refresh();
        return rtnVal.dataInfo;
    },
    //*********************************************************************************************
    

    //*********************************************************************************************
    // BiGroup 하나를 복재를 한다.
    //*********************************************************************************************
    copyBiGroup : function (oldId, gap){
      let oldGroup = this.Groups[oldId];
      let rtnVal  = this.addBiGroup(oldGroup.text
                                  , oldGroup.sPT.px     , oldGroup.sPT.py
                                  , oldGroup.size.width , oldGroup.size.height
                                  , oldGroup.bodyColor  , null);
      rtnVal.dataInfo.sPT.px += gap;
      rtnVal.dataInfo.sPT.py += gap;
      rtnVal.dataInfo.oPT.px += gap;
      rtnVal.dataInfo.oPT.py += gap;
      return rtnVal.dataInfo;
    },
    //*********************************************************************************************


    //*********************************************************************************************
    //
    //*********************************************************************************************
    copySelectedBox : function (){
      let newSelection = [];
      let copyMap = {};

      for(key in this.selNodes){
          let newNode = this.copyBiBox(key, 40);
          newSelection.push(newNode.id);
          copyMap[key] = newNode.id;
      }
      this.selNodes = {};
      for(let i=0;i<newSelection.length;i++){
        this.selNodes[newSelection[i]] = this.Nodes[newSelection[i]];
      }
      newSelection = [];
      for(key in this.selGroups){
        let newGroup = this.copyBiGroup(key, 40);
        newSelection.push(newGroup.id);
      }
      this.selGroups= {};
      for(let i=0;i<newSelection.length;i++){
        this.selGroups[newSelection[i]] = this.Groups[newSelection[i]];
      }

      newSelection = [];
      for(key in this.selLinks){
        let keys = key.split("_");
        let newLink = this.addBiLink(copyMap[keys[0]], copyMap[keys[1]], this.selLinks[key].sVector, this.selLinks[key].eVector, this.selLinks[key].type);
        if(newLink.clsName == 'addBiLink_Success'){
          newSelection.push(newLink.dataInfo.id);
        }
      }

      this.selLinks = {};
      for(let i=0;i<newSelection.length;i++){
        this.selLinks[newSelection[i]] = this.Links[newSelection[i]];
      }

      this.drawAll();
    },
    //*********************************************************************************************


    //*********************************************************************************************
    // 링크 추가 함수
    //*********************************************************************************************
    addBiLink : function(sName, eName, sVector, eVector, lineType){
      let returnValue = new EventCheckResult();
      if(sName == eName){
        returnValue.clsName = "addBiLink_Error";
        returnValue.msgInfo = "시작노드와 종료노드가 같은 연결은 생성할 수 없습니다.";
        return returnValue;
      }
      let newLink     = new BiLink();
      newLink.type    = lineType;
      newLink.id      = sName + '_' + eName;
      newLink.sVector = sVector;
      newLink.eVector = eVector;

      if(this.Nodes[sName][sVector] == null)  newLink.sPT = this.Nodes[sName].rightJoin;
      else                                    newLink.sPT = this.Nodes[sName][sVector];
      if(this.Nodes[eName][eVector] == null)  newLink.sPT = this.Nodes[sName].leftJoin;
      else                                    newLink.ePT = this.Nodes[eName][eVector];

      newLink.sName = sName;
      newLink.eName = eName;
      this.Links[sName + '_' + eName] = newLink;
      returnValue.clsName = "addBiLink_Success";
      returnValue.dataInfo = this.Links[sName + '_' + eName];
      return returnValue;
    },
    //*********************************************************************************************



    //*********************************************************************************************
    // 화면에 모든 데이터를 그린다.
    //*********************************************************************************************
    drawAll : function (){
      this.dc.clearRect(0, 0, this.canvasObj.width, this.canvasObj.height);

      //*******************************************************************************************
      // 그리드 그리기
      //*******************************************************************************************
      if(this.grid > 0){
        this.dc.strokeStyle = this.gridColor;
        this.dc.lineWidth = this.gridLineWidth;
        this.dc.beginPath();
        for(let i=this.grid;i<this.canvasObj.width;i+=this.grid) {
          this.dc.moveTo(i, 0);
          this.dc.lineTo(i, this.canvasObj.height);
        }
        for(let i=this.grid;i<this.canvasObj.height;i+=this.grid) {
          this.dc.moveTo(0, i);
          this.dc.lineTo(this.canvasObj.width, i);
        }
        this.dc.stroke();
      }
      //*********************************************************************************************


      for(var id in this.Rellys){
        this.Rellys[id].draw(this.dc, false);
      }

      //*******************************************************************************************
      // Group Draw
      //*******************************************************************************************
      for(var id in this.Groups){
        this.Groups[id].draw(this.dc, false);
      }
      for(var id in this.selGroups){
        this.selGroups[id].draw(this.dc, true);
      }
      //*******************************************************************************************


      //*******************************************************************************************
      // Node Draw
      //*******************************************************************************************
      for(var id in this.Nodes){
        this.Nodes[id].draw(this.dc, false);
      }
      for(var id in this.selNodes){
        this.selNodes[id].draw(this.dc, true);
      }
      //*******************************************************************************************


      //*******************************************************************************************
      // Link Draw
      //*******************************************************************************************
      for(var id in this.Links){
        this.Links[id].draw(this.dc, false);
      }
      for(var id in this.selLinks){
        this.selLinks[id].draw(this.dc, true);
      }
      //*******************************************************************************************


      for(var id in this.Images){
        this.Images[id].draw(this.dc, false);
      }
      for(var id in this.selImages){
        this.selImages[id].draw(this.dc, true);
      }
      

      //*******************************************************************************************
      // Virtual Link (On Mouse Link Mode)
      //*******************************************************************************************
      if(this.vLink != null) this.vLink.draw(this.dc, false);
      //*******************************************************************************************

      if(this.myCon != null) this.myCon.draw(this.dc, false);
    },
    //*********************************************************************************************



    //*********************************************************************************************
    // 브라우저 마우스 오른쪽 버튼 클릭시 나오는 팝업메뉴 안보이도록 하기 위함
    //*********************************************************************************************
    contextMenu : function(e){
      e.preventDefault();
    },
    //*********************************************************************************************



    //*********************************************************************************************
    // 단순히 화면만 살짝 클리어 할 뿐.... drawAll을 부르면 다시 화면에 항목들이 그려진다.
    //*********************************************************************************************
    clearAll : function (){
      this.dc.clearRect(0, 0, this.canvasObj.width, this.canvasObj.height);
    },
    //*********************************************************************************************
       

    onClick : function(event){
      
    },

    //*********************************************************************************************
    // 마우스 버튼 다운 이벤트
    //*********************************************************************************************
    onMouseDown : function(event){
      this.mouseButton = event.button;
      this.isMouseDown = true;
      if(!SD_Env.isEditable){
        this.firstX = event.offsetX;
        this.firstY = event.offsetY;
        return;
      }
      if(this.mouseButton == 0) {                                            /* 마우스 왼쪽 버튼 눌림 */
        //*****************************************************************************************
        // 각 노드별 마우스 커서 형태 및 모드 감지
        //*****************************************************************************************
        if(this.onBeforeMouseDown) this.onBeforeMouseDown(event);           /* 차후 개발 계획 ( 마우스 다운 이벤트 직전에 수행해야 할 사항 ) */
        
        //*****************************************************************************************
        // 그룹의 리사이즈 체크를 먼저 하는 이유는 만일 겹쳐져 있을 경우 그룹의 우선순위를 제일 뒤로 미루기 위함이다.
        //*****************************************************************************************
        for(var id in this.Groups){
          let rtnCheckInfo = this.Groups[id].checkCursorPoint(event.offsetX, event.offsetY, this.resizeMouseGap);
          if(rtnCheckInfo == null) continue;

          if(rtnCheckInfo.clsName == 'string') {                            /* Resize Mode */
            this.cursorName = rtnCheckInfo.dataInfo;
          }else{
            this.cursorName = null;
          }
          if(this.cursorName){
            this.canvasObj.style.cursor = this.cursorName;
            this.curNodeId = id;
            break;
          }
        }
        //*****************************************************************************************

        

        //*****************************************************************************************
        // 위에 그룹 리사이즈 체크를 하고 나서 다시 노드리사이즈 체크 들어간다 즉, 여기서 thiscurNodeId를 엎어 치면 되는것이다.
        //*****************************************************************************************
        for(var id in this.Nodes){
          let rtnCheckInfo = this.Nodes[id].checkCursorPoint(event.offsetX, event.offsetY, this.resizeMouseGap);
          if(rtnCheckInfo == null) continue;

          if(rtnCheckInfo.clsName == 'string') {                            /* Resize Mode */
            this.cursorName = rtnCheckInfo.dataInfo;
          }else if(rtnCheckInfo.clsName == 'BasicPoint') {                  /* Point Link Mode */
            if(this.vLink == null) this.vLink = new BiLink();
            this.cursorName = SD_Env.BTrackCursor['Cross'];
            this.vLink.id   = id;
            this.vLink.sPT  = rtnCheckInfo.dataInfo;
            this.vLink.ePT  = new BasicPoint(rtnCheckInfo.dataInfo.offsetX, rtnCheckInfo.dataInfo.offsetY);
            this.vLink.sName = id;
            this.vLink.eName = null;
            this.vLink.sVector = rtnCheckInfo.vectInfo;
            this.vLink.type = SD_Env.lineMode;
          }else{                                                            /* 나가리 : 쌩까면 된다. */
            this.cursorName = null;
          }
          if(this.cursorName){
            this.canvasObj.style.cursor = this.cursorName;
            this.curNodeId = id;
            isEventCatched = true;
            break;
          }
        }
        //*****************************************************************************************


        //*****************************************************************************************
        // 위의 사이즈, 링크등의 편집이 감지되지 않았으면 노드 선택하기를 감지한다. (우선 일반노드먼저)
        // 현재는 해당 포인트에 모두 속하는 노드들을 선택하도록 해놨는데... 음... 
        // 있다 보자고~ 한방에 여러개가 선택되는게 영~ 이상하면 그때 여기서 작업을 좀 해야긋제
        //*****************************************************************************************
        if(this.cursorName == null){
          if(!SD_Env.ctrlDown) {                                            /* 컨트롤키 눌려져 있지 않을 경우엔 기존 선택된 항목을 초기화 한다. */
            this.selGroups= {};
            this.selNodes = {};
            this.selLinks = {};
          }

          /*******************************************************************
          현재는 해당 포인트에 모두 속하는 노드들을 선택하도록 해놨는데... 음... 
          있다 보자고~ 한방에 여러개가 선택되는게 영~ 이상하면 그때 여기서 작업을 좀 해야긋제
          ********************************************************************/
          this.firstX = event.offsetX;
          this.firstY = event.offsetY;

          let reSelNode = '';
          let reSelLink = '';
          let nodeSelected = false;

          for(var id in this.Nodes){
            let selectInfo = this.Nodes[id].select(event.offsetX, event.offsetY);
            if(selectInfo == null) continue;
            nodeSelected = true;
            if(SD_Env.selMode == 3) {
              reSelNode = id;
              break;
            }else{
              this.selNodes[id] = this.Nodes[selectInfo.dataInfo];
              break;
            }
          }
          for(var id in this.Links){
            let selectInfo = this.Links[id].select(event.offsetX, event.offsetY, this.resizeMouseGap);
            if(selectInfo == null) continue;
            nodeSelected = true;
            if(SD_Env.selMode == 3) {
              reSelLink = id;
              break;
            }else{
              this.selLinks[id] = this.Links[selectInfo.dataInfo];
              break;
            }
          }
          

          //***************************************************************************************
          // BiBox, BiLink 연관선택관련 처리
          //***************************************************************************************
          if(reSelNode != '' && SD_Env.selMode == 3){                       /* 연관선택일경우 연관노드들을 줄줄이 찾아내어서 선택된 상태로 전환 */
            fncRelSelectBox(reSelNode, this.selNodes, this.selLinks, this.Nodes, this.Links);
          }
          if(reSelLink != '' && SD_Env.selMode == 3){
            let reSelAr = reSelLink.split("_");
            fncRelSelectBox(reSelAr[0], this.selNodes, this.selLinks, this.Nodes, this.Links);
            fncRelSelectBox(reSelAr[1], this.selNodes, this.selLinks, this.Nodes, this.Links);
          }
          //***************************************************************************************


          //***************************************************************************************
          // 아무것도 선택되지 않았을 경우에만 그룹을 선택하도록 한다. (그룹은 우선순위가 제일 하위이기 때문)
          //***************************************************************************************
          if(!nodeSelected){
            for(var id in this.Groups){
              let selectInfo = this.Groups[id].select(event.offsetX, event.offsetY);
              if(selectInfo == null) continue;
              this.selGroups[id] = this.Groups[selectInfo.dataInfo];
              let sx = this.selGroups[id].sPT.px;
              let sy = this.selGroups[id].sPT.py;
              let ex = this.selGroups[id].sPT.px + this.selGroups[id].size.width;
              let ey = this.selGroups[id].sPT.py + this.selGroups[id].size.height;

              //***********************************************************************************
              // 그룹의 연관선택
              // 연관선택모드에서 그룹선택이되면 해당 그룹안에 속한 모든 BiBox및 속한 그룹이 선택되도록 한다.
              // 링크는 바깥으로 삦어나가 있을 수 있으므로 그룹선택의 연관선택은 이런 컨셉이 맞을거 같다고 판단한다.
              //***********************************************************************************
              if(SD_Env.selMode == 2){  
                for(let nodeKey in this.Nodes){
                  if(this.Nodes[nodeKey].sPT.px < sx) continue;
                  if(this.Nodes[nodeKey].sPT.py < sy) continue;
                  if(this.Nodes[nodeKey].sPT.px > ex) continue;
                  if(this.Nodes[nodeKey].sPT.py > ey) continue;
                  if((this.Nodes[nodeKey].sPT.px + this.Nodes[nodeKey].size.width ) < sx) continue;
                  if((this.Nodes[nodeKey].sPT.py + this.Nodes[nodeKey].size.height) < sy) continue;
                  if((this.Nodes[nodeKey].sPT.px + this.Nodes[nodeKey].size.width ) > ex) continue;
                  if((this.Nodes[nodeKey].sPT.py + this.Nodes[nodeKey].size.height) > ey) continue;
                  this.selNodes[nodeKey] = this.Nodes[nodeKey];
                }
                for(let groupKey in this.Groups){
                  if(id == groupKey) continue;
                  if(this.Groups[groupKey].sPT.px < sx) continue;
                  if(this.Groups[groupKey].sPT.py < sy) continue;
                  if(this.Groups[groupKey].sPT.px > ex) continue;
                  if(this.Groups[groupKey].sPT.py > ey) continue;
                  if((this.Groups[groupKey].sPT.px + this.Groups[groupKey].size.width ) < sx) continue;
                  if((this.Groups[groupKey].sPT.py + this.Groups[groupKey].size.height) < sy) continue;
                  if((this.Groups[groupKey].sPT.px + this.Groups[groupKey].size.width ) > ex) continue;
                  if((this.Groups[groupKey].sPT.py + this.Groups[groupKey].size.height) > ey) continue;
                  this.selGroups[groupKey] = this.Groups[groupKey];
                }
              }
              //***********************************************************************************
              break;                                                        /* 그룹은 하나선택으로 마무리 지어야 하므로 여기서 바로 Break; */
            }
          }
          //***************************************************************************************

          this.drawAll();
        }
        //*****************************************************************************************


        if(this.onAfterSelect) this.onAfterSelect(event);                   /* 차후 개발 계획 ( 아이템 선택 직후에 자동으로 수행해야 할 사항 ) */
        //*****************************************************************************************
      }else{                                                                /* 마우스 왼쪽 버튼이 아닌 다른 버튼 (오른쪽=2) */
        this.firstX = event.offsetX;
        this.firstY = event.offsetY;
      }
    },
    onMouseMove : function(event){
      if(!SD_Env.isEditable && this.isMouseDown){
        let dx = this.firstX - event.offsetX;
        let dy = this.firstY - event.offsetY;
        moveScreen(dx, dy);
        this.firstX = event.offsetX;
        this.firstY = event.offsetY;
        this.drawAll();
        return;
      }
      //*******************************************************************************************
      // 각 노드별 마우스 커서 형태 및 모드 감지
      //*******************************************************************************************
      if(this.curNodeId == null){
        let nodeChecked = false;
        //*****************************************************************************************
        // 사이즈 변경모드 및 포인트 연결감지 : 우선적으로 노드 우선이다.
        //*****************************************************************************************
        for(var id in this.Nodes){
          let rtnCheckInfo = this.Nodes[id].checkCursorPoint(event.offsetX, event.offsetY, this.resizeMouseGap);
          if(rtnCheckInfo == null) {
            this.cursorName = null;
            this.canvasObj.style.cursor = null;
            continue;
          }
          nodeChecked = true;
          if(rtnCheckInfo.clsName == 'string') {                            /* Resize Mode */
            this.cursorName = rtnCheckInfo.dataInfo;
            break;
          }else if(rtnCheckInfo.clsName == 'BasicPoint') {                  /* Point Link Mode */
            this.cursorName = SD_Env.BTrackCursor['MouseLink'];                    //'pointer';
            break;
          }
        }
        //*****************************************************************************************


        //*****************************************************************************************
        // 그룹 사이즈 변경모드 감지 : 우선순위가 제일 낮다.
        //*****************************************************************************************
        if(!nodeChecked){
          for(var id in this.Groups){
            let rtnCheckInfo = this.Groups[id].checkCursorPoint(event.offsetX, event.offsetY, this.resizeMouseGap);
            if(rtnCheckInfo == null) {
              this.cursorName = null;
              this.canvasObj.style.cursor = '';
              continue;
            }
            if(rtnCheckInfo.clsName == 'string') {                            /* Resize Mode */
              this.cursorName = rtnCheckInfo.dataInfo;
            }else{
              this.cursorName = null;
            }
            break;
          }
        }
        //*****************************************************************************************


        //*****************************************************************************************
        // 커서모드 변경
        //*****************************************************************************************
        this.canvasObj.style.cursor = this.cursorName;
        if(this.cursorName == null || this.cursorName == '') this.canvasObj.style.cursor = '';
        //*****************************************************************************************
      }
      //*******************************************************************************************



      //*******************************************************************************************
      // 크기변경, 노드링크연결, 카메라 이동등등
      //*******************************************************************************************
      if(this.isMouseDown && this.mouseButton == 0){                        /* 마우스 왼쪽버튼 눌려진 상태 */
        if(this.curNodeId){                                                 /* 현재 대상 노드가 존재하는가 크기변경 혹은 Link연결 하려는가 보다~ */
          let xPos = Math.floor(S2R_X(event.offsetX)/this.snap) * this.snap;
          if(this.cursorName == SD_Env.BTrackCursor['HResize']){                   /* 가로 넓이 Resize */
            if(this.Nodes.hasOwnProperty(this.curNodeId)){
              if(xPos-this.Nodes[this.curNodeId].sPT.px >= 40){               /* 여기서 40은 미니멈 사이즈 */
                this.Nodes[this.curNodeId].size.width = xPos-this.Nodes[this.curNodeId].sPT.px;
              }
            }else if(this.Groups.hasOwnProperty(this.curNodeId)){
              if(xPos-this.Groups[this.curNodeId].sPT.px >= 40){               /* 여기서 40은 미니멈 사이즈 */
                this.Groups[this.curNodeId].size.width = xPos-this.Groups[this.curNodeId].sPT.px;
              }
            }
          }else if(this.cursorName == SD_Env.BTrackCursor['HVResize'])  {          /* 가로 세로 Resize */
            if(this.Nodes.hasOwnProperty(this.curNodeId)){
              if(xPos-this.Nodes[this.curNodeId].sPT.px >= 40){               /* 여기서 40은 미니멈 사이즈 */
                this.Nodes[this.curNodeId].size.width = xPos-this.Nodes[this.curNodeId].sPT.px;
              }
              let yPos = Math.floor(S2R_Y(event.offsetY)/this.snap) * this.snap;
//*************************************************************************************************
// To-DO : 올림 연산에서 반올림 연산으로 변화한 영향으로 인한 현상으로 간주됨
// 브라우저 확대, 축소 도중에 yPos값이 +1이 되는 경우가 발생 : 화면조정 연산시에 snap단위로 잘라 주는 연산이 필요하다
// console.log("yPos = " + yPos);
//*************************************************************************************************
              if(yPos-this.Nodes[this.curNodeId].sPT.py >= 40){               /* 여기서 40은 미니멈 사이즈 */
                this.Nodes[this.curNodeId].size.height = yPos-this.Nodes[this.curNodeId].sPT.py;
              }  
            }else if(this.Groups.hasOwnProperty(this.curNodeId)){
              if(xPos-this.Groups[this.curNodeId].sPT.px >= 40){               /* 여기서 40은 미니멈 사이즈 */
                this.Groups[this.curNodeId].size.width = xPos-this.Groups[this.curNodeId].sPT.px;
              }
              let yPos = Math.floor(S2R_Y(event.offsetY)/this.snap) * this.snap;
              if(yPos-this.Groups[this.curNodeId].sPT.py >= 40){               /* 여기서 40은 미니멈 사이즈 */
                this.Groups[this.curNodeId].size.height = yPos-this.Groups[this.curNodeId].sPT.py;
              }  
            }
          }else{                                                            /* 노드연결모드 */
            this.vLink.ePT.px = S2R_X(event.offsetX);
            this.vLink.ePT.py = S2R_Y(event.offsetY);
            let isFind = false;
            for(var id in this.Nodes){
              let rtnCheckInfo = this.Nodes[id].checkCursorPoint(event.offsetX, event.offsetY, this.resizeMouseGap);
              if(rtnCheckInfo == null) continue;
              if(rtnCheckInfo.clsName == 'BasicPoint'){
                this.canvasObj.style.cursor = SD_Env.BTrackCursor['MouseLink'];
                isFind = true;
                break;
              }
            }
            if(!isFind){
              this.canvasObj.style.cursor = SD_Env.BTrackCursor['Cross'];
            }
          }
          if(this.Nodes.hasOwnProperty(this.curNodeId)){
            this.Nodes[this.curNodeId].refresh();                             /* 해당 노드의 크기가 변경되었을 경우 연결점의 위치를 재설정해야 하므로 refresh한다. */
          }
          this.drawAll();
        }else{                                                              /* 현재 대상 노드가 존재하지 않음 = 선택된 노드 이동하려는가 보다~ */
          let xPos = Math.floor((event.offsetX-this.firstX)/this.snap) * this.snap;
          let yPos = Math.floor((event.offsetY-this.firstY)/this.snap) * this.snap;
          for(let id in this.selNodes){
            this.selNodes[id].moveView(xPos, yPos);
          }
          for(let id in this.selGroups){
            this.selGroups[id].moveView(xPos, yPos);
          }
          this.drawAll();
        }
      }else if(this.isMouseDown && this.mouseButton == 2){                  /* 마우스 오른쪽 버튼이 눌려진 상태 : Cam Move Mode */
        let dx = this.firstX - event.offsetX;
        let dy = this.firstY - event.offsetY;
        moveScreen(dx, dy);
        this.firstX = event.offsetX;
        this.firstY = event.offsetY;
        this.drawAll();
      }
      //*******************************************************************************************
    },
    //*********************************************************************************************



    //*********************************************************************************************
    // 마우스 버튼 땠을때 : 어느버튼이 때졌느냐에 따라서 요리조리 튕기것제~
    //*********************************************************************************************
    onMouseUp : function(event){
      this.isMouseDown = false;
      if(SD_Env.isEditable){
        if(this.curNodeId == null) {                                          /* 선택된 노드 이동전용 */
          if(this.mouseButton == 0){
            let xPos = Math.floor((event.offsetX-this.firstX)/this.snap) * this.snap;
            let yPos = Math.floor((event.offsetY-this.firstY)/this.snap) * this.snap;
            for(var id in this.selNodes){
              this.selNodes[id].moveTo(xPos, yPos);
            }
            for(let id in this.selGroups){
              this.selGroups[id].moveTo(xPos, yPos);
            }
            this.drawAll();
          }else if(this.mouseButton == 2){                                    /* Camera 이동모드 종료 */
            SD_Env.camX = Math.floor(SD_Env.camX/this.snap) * this.snap;
            SD_Env.camY = Math.floor(SD_Env.camY/this.snap) * this.snap;
            this.drawAll();
          }
        }else if(this.vLink != null){                                         /* Link 모드 종료 */
          for(var id in this.Nodes){
            let rtnCheckInfo = this.Nodes[id].checkCursorPoint(event.offsetX, event.offsetY, this.resizeMouseGap);
            if(rtnCheckInfo == null) continue;
            if(rtnCheckInfo.clsName == 'BasicPoint'){
              this.addBiLink(this.vLink.sName, id, this.vLink.sVector, rtnCheckInfo.vectInfo, SD_Env.lineMode);
              break;
            }
          }

          this.drawAll();
        }
      }else{
        SD_Env.camX = Math.floor(SD_Env.camX/this.snap) * this.snap;
        SD_Env.camY = Math.floor(SD_Env.camY/this.snap) * this.snap;
        this.drawAll();
      }
      this.vLink        = null;
      this.curNodeId    = null;
      this.cursorName   = null;
      this.canvasObj.style.cursor = '';
      this.mouseButton  = -1;
    },
    //*********************************************************************************************



    //*********************************************************************************************
    // 디자이너 메모리 클리어~ 초기화
    //*********************************************************************************************
    clean : function(camClean){
      if(camClean){
        SD_Env.camX = 0;
        SD_Env.camY = 0;
      }
      this.maxSeq       = 0;
      this.Groups       = [];
      this.selGroups    = [];
      this.Nodes        = [];
      this.selNodes     = [];
      this.Links        = [];
      this.selLinks     = [];
      this.curNodeId    = null;
      this.cursorName   = null;
      this.isMouseDown  = false;
      this.mouseButton  = -1;
      this.firstX       = 0;
      this.firstY       = 0;
    },
    //*********************************************************************************************



    //*********************************************************************************************
    // 제이슨 문자열로 부터 디자이너 데이터 읽어들이기
    //*********************************************************************************************
    loadFromJson : function(jsonObj){
      this.clean(true);
      SD_Env.camX = jsonObj.camX;
      SD_Env.camY = jsonObj.camY;
      let maxId = 0;
      let thisObj = this;
      for(key in jsonObj.nodeGroup){
        if(maxId < Number.parseInt(key, 36)) maxId = Number.parseInt(key, 36);
        if(jsonObj.nodeGroup[key].hasOwnProperty('img')){
          this.addBiImage(convertBase64ToImage(jsonObj.nodeGroup[key].img)
                      , jsonObj.nodeGroup[key].px
                      , jsonObj.nodeGroup[key].py
                      , jsonObj.nodeGroup[key].width
                      , jsonObj.nodeGroup[key].height
                      , key
          );
        }else if(jsonObj.nodeGroup[key].hasOwnProperty('con')){  
          //addBiCon : function (x,y,r,color, boxId){
          this.addBiCon(jsonObj.nodeGroup[key].text
                      , jsonObj.nodeGroup[key].px
                      , jsonObj.nodeGroup[key].py
                      , jsonObj.nodeGroup[key].width
                      , jsonObj.nodeGroup[key].bodyColor
                      , key
          );
        }else if(jsonObj.nodeGroup[key].hasOwnProperty('quat')){  
          //addBiQuat : function (boxTxt, x,y,w,h,color, boxId){
          this.addBiQuat(jsonObj.nodeGroup[key].text
                       , jsonObj.nodeGroup[key].px
                       , jsonObj.nodeGroup[key].py
                       , jsonObj.nodeGroup[key].width
                       , jsonObj.nodeGroup[key].height
                       , jsonObj.nodeGroup[key].bodyColor
                       , key
          );
        }else{
          this.addBiBox(jsonObj.nodeGroup[key].text
                      , jsonObj.nodeGroup[key].px
                      , jsonObj.nodeGroup[key].py
                      , jsonObj.nodeGroup[key].width
                      , jsonObj.nodeGroup[key].height
                      , jsonObj.nodeGroup[key].bodyColor
                      , key
          );
        }
      }
      for(key in jsonObj.linkGroup){
        if(maxId < Number.parseInt(key, 36)) maxId = Number.parseInt(key, 36);
        if(jsonObj.linkGroup[key].hasOwnProperty('type')){
          this.addBiLink(jsonObj.linkGroup[key].sName
                      , jsonObj.linkGroup[key].eName
                      , jsonObj.linkGroup[key].sVector
                      , jsonObj.linkGroup[key].eVector
                      , jsonObj.linkGroup[key].type
                      );
        }else{
          this.addBiLink(jsonObj.linkGroup[key].sName
            , jsonObj.linkGroup[key].eName
            , jsonObj.linkGroup[key].sVector
            , jsonObj.linkGroup[key].eVector
            , 'solidLine'
            );
        }
      }
      for(key in jsonObj.groupGroup){
        if(maxId < Number.parseInt(key, 36)) maxId = Number.parseInt(key, 36);
        this.addBiGroup(jsonObj.groupGroup[key].text
                  , jsonObj.groupGroup[key].px
                  , jsonObj.groupGroup[key].py
                  , jsonObj.groupGroup[key].width
                  , jsonObj.groupGroup[key].height
                  , jsonObj.groupGroup[key].bodyColor
                  , key
        );
      }
      this.maxSeq = maxId;
      this.drawAll();
    },
    //*********************************************************************************************


    //*********************************************************************************************
    // 디자이너 데이터를 제이슨 문자열로 전환하기 : 파일로 떨구기 위함
    //*********************************************************************************************
    getJsonData : function (jsonNames, targetPos1, targetPos2){
      let groupGroup = {};
      let nodeGroup  = {};
      let linkGroup  = {};
      for(let nodeKey in this.Nodes){
        let myNode  = this.Nodes[nodeKey];
        if(myNode.img == null){
          if(myNode.con == null){
            if(myNode.quat == null){ // --------------BiBox
              let node    = {
                'px'        : myNode.sPT.px,
                'py'        : myNode.sPT.py,
                'width'     : myNode.size.width,
                'height'    : myNode.size.height,
                'text'      : myNode.text,
                'id'        : myNode.id,
                'bodyColor' : myNode.bodyColor,
              };
              nodeGroup[myNode.id] = node;
            }else{ // --------------------------------BiQuat
              let node    = {
                'px'        : myNode.sPT.px,
                'py'        : myNode.sPT.py,
                'width'     : myNode.size.width,
                'height'    : myNode.size.height,
                'text'      : myNode.text,
                'id'        : myNode.id,
                'bodyColor' : myNode.bodyColor,
                'quat'      : myNode.quat,
              };
              nodeGroup[myNode.id] = node;
            }
          }else{ // ----------------------------------BiCon
            let node    = {
              'px'        : myNode.sPT.px,
              'py'        : myNode.sPT.py,
              'width'     : myNode.size.width,
              'height'    : myNode.size.height,
              'text'      : myNode.text,
              'id'        : myNode.id,
              'bodyColor' : myNode.bodyColor,
              'con'       : myNode.con,
            };
            nodeGroup[myNode.id] = node;
          }
        }else{ // ------------------------------------BiImage
          let node    = {
            'px'        : myNode.sPT.px,
            'py'        : myNode.sPT.py,
            'width'     : myNode.size.width,
            'height'    : myNode.size.height,
            'text'      : '',
            'id'        : myNode.id,
            'bodyColor' : myNode.bodyColor,
            'img'       : convertImageToBase64(myNode.img),
          };
          nodeGroup[myNode.id] = node;
        }
      }
      for(let linkKey in this.Links){
        let myLink = this.Links[linkKey];
        let link = {
          'sName'   : myLink.sName,
          'eName'   : myLink.eName,
          'sVector' : myLink.sVector,
          'eVector' : myLink.eVector,
          'type'    : myLink.type,
        };
        linkGroup[myLink.sName + '_' + myLink.eName] = link;
      }
      for(let groupKey in this.Groups){
        let myGroup = this.Groups[groupKey];
        let group = {
          'px'        : myGroup.sPT.px,
          'py'        : myGroup.sPT.py,
          'width'     : myGroup.size.width,
          'height'    : myGroup.size.height,
          'text'      : myGroup.text,
          'id'        : myGroup.id,
          'bodyColor' : myGroup.bodyColor,
        };
        groupGroup[myGroup.id] = group;
      }
      let jsonData = {
          camX : SD_Env.camX,
          camY : SD_Env.camY,
          nodeGroup  : nodeGroup,
          linkGroup  : linkGroup,
          groupGroup : groupGroup,
      };
      
      return jsonData;
    },
    //*********************************************************************************************
    onBeforeMouseDown : null,
    onAfterSelect : null,
    //*********************************************************************************************
    // 객체 선택해서 팝업 띄우려 한다.
    // 던지는 객체는 엄연히 다르지만, 서로 text, bodyColor, id 등등의 변경세팅하려하는 
    // Property는 같은 이름으로 같이 존재하므로 자연스럽게 CallByReference로 동작이 된다.
    //*********************************************************************************************
    onDblClick : function(event){
      if(!SD_Env.isEditable){
        return;
      }
      if(this.openBiEditPop == null){
        console.log("openBiEditPop 함수를 세팅하지 않았습니다.");
        return;
      }
      for(let id in this.Nodes){
        let selectInfo = this.Nodes[id].select(event.offsetX, event.offsetY);
        if(selectInfo == null) continue;
        
        if(this.Nodes[selectInfo.dataInfo].img != null) continue;   // 이미지는 편집 팝업이 없다.

        this.selNodes = {};
        this.selNodes[id] = this.Nodes[selectInfo.dataInfo];
        this.openBiEditPop(this.Nodes[selectInfo.dataInfo], "BiBox");
        return;
      }
      for(let id in this.Groups){
        let selectInfo = this.Groups[id].select(event.offsetX, event.offsetY);
        if(selectInfo == null) continue;
        this.selGroups= {};
        this.selGroups[id] = this.Groups[selectInfo.dataInfo];
        this.openBiEditPop(this.Groups[selectInfo.dataInfo], "BiGroup");
      }
    },
    //*********************************************************************************************



    //*********************************************************************************************
    // 현재 선택된 모든 메모리를 지운다.
    //*********************************************************************************************
    deleteSelItems : function(){
      for(let key in this.selGroups){
        delete this.Groups[key];
      }
      this.selGroups= {};
      for(let key in this.selLinks){
        delete this.Links[key];
      }
      this.selLinks = {};
      for(let key in this.selNodes){
        delete this.Nodes[key];
      }
      this.selNodes = {};
    },
    //*********************************************************************************************



    //*********************************************************************************************
    // 사용처(화면 페이지)에서 해당 함수를 등록해줘야 되것제? ㅋ
    //*********************************************************************************************
    setBiEditFunction  : function(callBackFunction){
      this.openBiEditPop = callBackFunction;
    },
    //*********************************************************************************************



    //*********************************************************************************************
    // 화면에 그려진 객체를 찾을때 사용한다. - 사용하는 키는 화면에 그려진 객체에 포함된 택스트로 찾는다.
    //*********************************************************************************************
    searchInData : function(searchTxt, notFoundCallback){
      let findedKey = '';
      if(SD_Env.curSearchNm == searchTxt){
        searchTxt = searchTxt.toLowerCase();
        let findcur = false;
        for(let key in this.Nodes){
          let dumy = this.Nodes[key].text.toLowerCase();
          if(key == SD_Env.curSearchId){
            findcur = true;
            continue;
          }
          if(!findcur) continue;
          if(dumy.indexOf(searchTxt) >= 0){
            findedKey = key;
            SD_Env.curSearchId = key;
            break;
          }
        }
      }else{
        SD_Env.curSearchNm = searchTxt;
        searchTxt = searchTxt.toLowerCase();
        for(let key in this.Nodes){
          let dumy = this.Nodes[key].text.toLowerCase();
          if(dumy.indexOf(searchTxt) >= 0){
            findedKey = key;
            SD_Env.curSearchId = key;
            break;
          }
        }
      }
 
      let sl = 600;       // 임시로 상수화해놨으나, 실제 모니터 해상도에 다라서 계산되어야 한다.
      let st = 400;
      if(findedKey != ''){
        this.selNodes = {};
        this.selNodes[findedKey] = this.Nodes[findedKey];
        SD_Env.camX = this.Nodes[findedKey].sPT.px - sl;
        SD_Env.camY = this.Nodes[findedKey].sPT.py - st;
        this.drawAll();
      }else{
        notFoundCallback(searchTxt);
      }
    },
    //*********************************************************************************************



    //*********************************************************************************************
    // 미니맵 그리기 
    //*********************************************************************************************
    drawMiniMap : function(dc, cWidth, cHeight){
      let minX = 99999;
      let minY = 99999;
      let maxX = -99999;
      let maxY = -99999;
      let dataWidth = 0;
      let dataHeight = 0;

      //*******************************************************************************************
      // 분포된 데이터의 전체 사이즈 체크
      //*******************************************************************************************
      for(let key in this.Nodes){
        if(minX > this.Nodes[key].sPT.px) minX = this.Nodes[key].sPT.px;
        if(minY > this.Nodes[key].sPT.py) minY = this.Nodes[key].sPT.py;
        if(maxX < (this.Nodes[key].sPT.px + this.Nodes[key].size.width )) maxX = this.Nodes[key].sPT.px + this.Nodes[key].size.width;
        if(maxY < (this.Nodes[key].sPT.py + this.Nodes[key].size.height)) maxY = this.Nodes[key].sPT.py + this.Nodes[key].size.height;
      } 

      for(let key in this.Groups){
        if(minX > this.Groups[key].sPT.px) minX = this.Groups[key].sPT.px;
        if(minY > this.Groups[key].sPT.py) minY = this.Groups[key].sPT.py;
        if(maxX < (this.Groups[key].sPT.px + this.Groups[key].size.width )) maxX = this.Groups[key].sPT.px + this.Groups[key].size.width;
        if(maxY < (this.Groups[key].sPT.py + this.Groups[key].size.height)) maxY = this.Groups[key].sPT.py + this.Groups[key].size.height;
      }
      //*******************************************************************************************
      if(minX > SD_Env.camX) minX = SD_Env.camX;
      if(minY > SD_Env.camY) minY = SD_Env.camY;
      if(maxX < (SD_Env.camX + canvas.width )) maxX = SD_Env.camX + canvas.width;
      if(maxY < (SD_Env.camY + canvas.height)) maxY = SD_Env.camY + canvas.height;

      //*******************************************************************************************
      // 실제 데이터의 최소, 최대 좌표값으로 데이터 넓이와 높이를 구한다.
      //*******************************************************************************************
      dataWidth  = maxX - minX;
      dataHeight = maxY - minY;
      //*******************************************************************************************

      let rw = cWidth / dataWidth;
      let rh = cHeight / dataHeight;
      let rate = rw;
      if(rw > rh) rate = rh;                                    // 실제데이터와 미니맵의 크기에 맞춰서 일그러짐 없게 하기 위해 최소배율을 적용한다.

      dc.clearRect(0, 0, cWidth, cHeight);
      dc.strokeStyle  = '#a8a8a8';
      dc.lineWidth    = 1;
      dc.beginPath();
      for(let key in this.Nodes){
        if(this.Nodes[key].quat){
          dc.moveTo((this.Nodes[key].topJoin.px     - minX) * rate, (this.Nodes[key].topJoin.py     - minY) * rate);
          dc.lineTo((this.Nodes[key].leftJoin.px    - minX) * rate, (this.Nodes[key].leftJoin.py    - minY) * rate);
          dc.lineTo((this.Nodes[key].bottomJoin.px  - minX) * rate, (this.Nodes[key].bottomJoin.py  - minY) * rate);
          dc.lineTo((this.Nodes[key].rightJoin.px   - minX) * rate, (this.Nodes[key].rightJoin.py   - minY) * rate);
          dc.lineTo((this.Nodes[key].topJoin.px     - minX) * rate, (this.Nodes[key].topJoin.py     - minY) * rate);
        }else if(this.Nodes[key].con){
          let sx = this.Nodes[key].sPT.px - minX;                 // 최소값의 좌표가 0이 되어야 하기 때문에 minX를 빼준다.
          let sy = this.Nodes[key].sPT.py - minY;                 // 최소값의 좌표가 0이 되어야 하기 때문에 minY를 빼준다.
          let ww = this.Nodes[key].size.width;
          dc.moveTo((sx + this.Nodes[key].size.width)*rate, sy* rate);
          dc.arc(sx*rate, sy*rate, ww * rate, 0, 2 * Math.PI);
        }else{
          let sx = this.Nodes[key].sPT.px - minX;                 // 최소값의 좌표가 0이 되어야 하기 때문에 minX를 빼준다.
          let sy = this.Nodes[key].sPT.py - minY;                 // 최소값의 좌표가 0이 되어야 하기 때문에 minY를 빼준다.
          let ww = this.Nodes[key].size.width;
          let hh = this.Nodes[key].size.height;
          dc.moveTo(sx*rate, sy*rate);
          dc.strokeRect(sx*rate, sy*rate, ww*rate, hh*rate);
        }
      }
      
      for(let key in this.Groups){
        let sx = this.Groups[key].sPT.px - minX;                 // 최소값의 좌표가 0이 되어야 하기 때문에 minX를 빼준다.
        let sy = this.Groups[key].sPT.py - minY;                 // 최소값의 좌표가 0이 되어야 하기 때문에 minY를 빼준다.
        let ww = this.Groups[key].size.width;
        let hh = this.Groups[key].size.height;
        dc.moveTo(sx*rate, sy*rate);
        dc.strokeRect(sx*rate, sy*rate, ww*rate, hh*rate);
      }
      for(let key in this.Links){
        let sx = this.Links[key].sPT.px - minX;
        let sy = this.Links[key].sPT.py - minY;
        let ex = this.Links[key].ePT.px - minX;
        let ey = this.Links[key].ePT.py - minY;
        dc.moveTo(sx*rate, sy*rate);
        dc.lineTo(ex*rate, ey*rate);
      }
      dc.stroke();
      //*******************************************************************************************
      // 현재 화면이 있는 위치를 미니맵에 표시한다.
      //*******************************************************************************************
      MiniMapInfo.minX      = minX;
      MiniMapInfo.minY      = minY;
      MiniMapInfo.cWidth    = cWidth;
      MiniMapInfo.cHeight   = cHeight;
      MiniMapInfo.rate      = rate;
      MiniMapInfo.screenSX  = (SD_Env.camX - minX)*rate;
      MiniMapInfo.screenSY  = (SD_Env.camY - minY)*rate;
      MiniMapInfo.screenWD  = canvas.width*rate;
      MiniMapInfo.screenHT  = canvas.height*rate;
      MiniMapInfo.drawScreenAngle(dc);
      //dc.beginPath();
      //dc.lineWidth = 2;
      //dc.strokeStyle = '#EA5252';
      //dc.moveTo((SD_Env.camX - minX)*rate, (SD_Env.camY-minY)*rate);
      //dc.strokeRect((SD_Env.camX - minX)*rate, (SD_Env.camY-minY)*rate, canvas.width*rate, canvas.height*rate);
      //dc.stroke();
      //*******************************************************************************************
    },
    //*********************************************************************************************

    miniMapMouseDown : function(e, dc){
      return;
      dc.clearRect(0, 0, MiniMapInfo.cWidth, MiniMapInfo.cHeight);
      dc.strokeStyle  = '#a8a8a8';
      dc.lineWidth    = 1;
      dc.beginPath();
      for(let key in this.Nodes){
        let sx = this.Nodes[key].sPT.px - MiniMapInfo.minX;                 // 최소값의 좌표가 0이 되어야 하기 때문에 minX를 빼준다.
        let sy = this.Nodes[key].sPT.py - MiniMapInfo.minY;                 // 최소값의 좌표가 0이 되어야 하기 때문에 minY를 빼준다.
        let ww = this.Nodes[key].size.width;
        let hh = this.Nodes[key].size.height;
        dc.moveTo(sx*MiniMapInfo.rate, sy*MiniMapInfo.rate);
        dc.strokeRect(sx*MiniMapInfo.rate, sy*MiniMapInfo.rate, ww*MiniMapInfo.rate, hh*MiniMapInfo.rate);
      }
      for(let key in this.Groups){
        let sx = this.Groups[key].sPT.px - MiniMapInfo.minX;                 // 최소값의 좌표가 0이 되어야 하기 때문에 minX를 빼준다.
        let sy = this.Groups[key].sPT.py - MiniMapInfo.minY;                 // 최소값의 좌표가 0이 되어야 하기 때문에 minY를 빼준다.
        let ww = this.Groups[key].size.width;
        let hh = this.Groups[key].size.height;
        dc.moveTo(sx*MiniMapInfo.rate, sy*MiniMapInfo.rate);
        dc.strokeRect(sx*MiniMapInfo.rate, sy*MiniMapInfo.rate, ww*MiniMapInfo.rate, hh*MiniMapInfo.rate);
      }
      for(let key in this.Links){
        let sx = this.Links[key].sPT.px - MiniMapInfo.minX;
        let sy = this.Links[key].sPT.py - MiniMapInfo.minY;
        let ex = this.Links[key].ePT.px - MiniMapInfo.minX;
        let ey = this.Links[key].ePT.py - MiniMapInfo.minY;
        dc.moveTo(sx*MiniMapInfo.rate, sy*MiniMapInfo.rate);
        dc.lineTo(ex*MiniMapInfo.rate, ey*MiniMapInfo.rate);
      }
      dc.stroke();

      let sx = e.offsetX - MiniMapInfo.screenWD/2;
      let sy = e.offsetY - MiniMapInfo.screenHT/2;
      MiniMapInfo.screenSX = sx;
      MiniMapInfo.screenSY = sy;
      MiniMapInfo.drawScreenAngle(dc);
      SD_Env.camX = sx / MiniMapInfo.rate;
      SD_Env.camY = sy / MiniMapInfo.rate;
      SD_Env.camX = Math.floor(SD_Env.camX/this.snap) * this.snap;
      SD_Env.camY = Math.floor(SD_Env.camY/this.snap) * this.snap;
      this.drawAll();
    },

    //*********************************************************************************************
    // 현재 선택된 항목에 대하여 JSON형태로 전환하여 보여주기 위함( 클립보드 복사하라는 의도겠지? )
    //*********************************************************************************************
    getJsonText : function(){
      let groupGroup = {};
      let nodeGroup  = {};
      let linkGroup  = {};
      for(let nodeKey in this.selNodes){
        let myNode = this.selNodes[nodeKey];
        if(myNode.img == null){
          if(myNode.con == null){
            if(myNode.quat == null){ // --------------BiBox
              let node    = {
                'px'        : myNode.sPT.px,
                'py'        : myNode.sPT.py,
                'width'     : myNode.size.width,
                'height'    : myNode.size.height,
                'text'      : myNode.text,
                'id'        : myNode.id,
                'bodyColor' : myNode.bodyColor,
              };
              nodeGroup[myNode.id] = node;
            }else{ // --------------------------------BiQuat
              let node    = {
                'px'        : myNode.sPT.px,
                'py'        : myNode.sPT.py,
                'width'     : myNode.size.width,
                'height'    : myNode.size.height,
                'text'      : myNode.text,
                'id'        : myNode.id,
                'bodyColor' : myNode.bodyColor,
                'quat'      : myNode.quat,
              };
              nodeGroup[myNode.id] = node;
            }
          }else{ // ----------------------------------BiCon
            let node    = {
              'px'        : myNode.sPT.px,
              'py'        : myNode.sPT.py,
              'width'     : myNode.size.width,
              'height'    : myNode.size.height,
              'text'      : myNode.text,
              'id'        : myNode.id,
              'bodyColor' : myNode.bodyColor,
              'con'       : myNode.con,
            };
            nodeGroup[myNode.id] = node;
          }
        }else{ // ------------------------------------BiImage
          let node    = {
            'px'        : myNode.sPT.px,
            'py'        : myNode.sPT.py,
            'width'     : myNode.size.width,
            'height'    : myNode.size.height,
            'text'      : '',
            'id'        : myNode.id,
            'bodyColor' : myNode.bodyColor,
            'img'       : convertImageToBase64(myNode.img),
          };
          nodeGroup[myNode.id] = node;
        }
      }
      //*******************************************************************************************
      // 링크는 선택된 모든 링크가 복제되지 않는다.
      // JSONText로 출력이된다고 하더라도, 붙여넣을때 반드시 BiBox가 같이 동반되어야 붙여넣어 진다.
      // 즉, 링크가 정상적으로 복제가 되려면 해당 링크의 시작, 끝의 BiBox둘다 선택된 상태여야 한다.
      //*******************************************************************************************
      for(let linkKey in this.selLinks){
        let myLink = this.selLinks[linkKey];
        let link = {
          'sName'   : myLink.sName,
          'eName'   : myLink.eName,
          'sVector' : myLink.sVector,
          'eVector' : myLink.eVector,
          'type'    : myLink.type,
        };
        linkGroup[myLink.sName + '_' + myLink.eName] = link;
      }
      for(let groupKey in this.selGroups){
        let myGroup = this.selGroups[groupKey];
        let group = {
          'px'        : myGroup.sPT.px,
          'py'        : myGroup.sPT.py,
          'width'     : myGroup.size.width,
          'height'    : myGroup.size.height,
          'text'      : myGroup.text,
          'id'        : myGroup.id,
          'bodyColor' : myGroup.bodyColor,
        };
        groupGroup[myGroup.id] = group;
      }
      let jsonData = {
          nodeGroup  : nodeGroup,
          linkGroup  : linkGroup,
          groupGroup : groupGroup,
      };
      
      return JSON.stringify(jsonData);
    },
    //*********************************************************************************************



    //*********************************************************************************************
    // 복사한 JSON을 JSON팝업에 입력하고 JSON추가를 통하여 다른 브라우저에 붙여넣기 효과를 주기 위함
    //*********************************************************************************************
    addFromJsonText : function(jsonData){
      let jsonObj = JSON.parse(jsonData);
      let copyMap = {};
      for(key in jsonObj.nodeGroup){
        if(this.maxSeq < Number.parseInt(key, 36)) this.maxSeq = Number.parseInt(key, 36);
        else this.maxSeq ++;
        maxId = this.maxSeq.toString(36);
        if(jsonObj.nodeGroup[key].hasOwnProperty('img')){ // -------------BiImage
          this.addBiImage(convertBase64ToImage(jsonObj.nodeGroup[key].img)
                        , jsonObj.nodeGroup[key].px
                        , jsonObj.nodeGroup[key].py
                        , jsonObj.nodeGroup[key].width
                        , jsonObj.nodeGroup[key].height
                        , maxId
          );
        }else if(jsonObj.nodeGroup[key].hasOwnProperty('con')){ // -------BiCon
          this.addBiCon(jsonObj.nodeGroup[key].text
                      , jsonObj.nodeGroup[key].px
                      , jsonObj.nodeGroup[key].py
                      , jsonObj.nodeGroup[key].width
                      , jsonObj.nodeGroup[key].bodyColor
                      , maxId
          );
        }else if(jsonObj.nodeGroup[key].hasOwnProperty('quat')){ // ------BiQuat 
          this.addBiQuat(jsonObj.nodeGroup[key].text
                       , jsonObj.nodeGroup[key].px
                       , jsonObj.nodeGroup[key].py
                       , jsonObj.nodeGroup[key].width
                       , jsonObj.nodeGroup[key].height
                       , jsonObj.nodeGroup[key].bodyColor
                       , maxId
          );
        }else{  // -------------------------------------------------------BiBox
          this.addBiBox(jsonObj.nodeGroup[key].text
            , jsonObj.nodeGroup[key].px
            , jsonObj.nodeGroup[key].py
            , jsonObj.nodeGroup[key].width
            , jsonObj.nodeGroup[key].height
            , jsonObj.nodeGroup[key].bodyColor
            , maxId
            );
        }
        copyMap[key] = maxId;
      }

      for(key in jsonObj.groupGroup){
        if(this.maxSeq < Number.parseInt(key, 36)) this.maxSeq = Number.parseInt(key, 36);
        else this.maxSeq++;
        maxId = this.maxSeq.toString(36);
        this.addBiGroup(jsonObj.groupGroup[key].text
                      , jsonObj.groupGroup[key].px
                      , jsonObj.groupGroup[key].py
                      , jsonObj.groupGroup[key].width
                      , jsonObj.groupGroup[key].height
                      , jsonObj.groupGroup[key].bodyColor
                      , maxId
                      );
      }
      // 링크는 반드시 BiBox에 의존하므로 시작, 끝의 BiBox가 같이 동반되지 않은 링크는 여기서 복제되지 못한다.
      for(key in jsonObj.linkGroup){
        let keys = key.split("_");
        this.addBiLink(copyMap[keys[0]], copyMap[keys[1]], jsonObj.linkGroup[key].sVector, jsonObj.linkGroup[key].eVector, jsonObj.linkGroup[key].type);
      }

      this.maxSeq = Number.parseInt(maxId, 36);
      this.drawAll();
    },
    //*********************************************************************************************



    //*********************************************************************************************
    //
    //*********************************************************************************************
    selItemAllChange : function(color){

      for(let key in this.selNodes){
console.log("Before " + this.selNodes[key].bodyColor);
        this.selNodes[key].bodyColor = color;
console.log("After " + this.selNodes[key].bodyColor);
      }
      for(let key in this.selGroups){
        this.selGroups[key].bodyColor = color;
      }
      this.drawAll();
    },
    //*********************************************************************************************



    //*********************************************************************************************
    // 현재 선택된 항목들을 커서키로 이동시킬 수 있도록 구현
    //*********************************************************************************************
    moveOneStep : function(v){
      if(v == "L"){
        for(let key in this.selNodes){
          this.selNodes[key].sPT.px -= this.snap;
          this.selNodes[key].oPT.px -= this.snap;
          this.selNodes[key].refresh();
        }
        for(let key in this.selGroups){
          this.selGroups[key].sPT.px -= this.snap;
          this.selGroups[key].oPT.px -= this.snap;
        }
      }else if(v == "U"){
        for(let key in this.selNodes){
          this.selNodes[key].sPT.py -= this.snap;
          this.selNodes[key].oPT.py -= this.snap;
          this.selNodes[key].refresh();
        }
        for(let key in this.selGroups){
          this.selGroups[key].sPT.py -= this.snap;
          this.selGroups[key].oPT.py -= this.snap;
        }
      }else if(v == "R"){
        for(let key in this.selNodes){
          this.selNodes[key].sPT.px += this.snap;
          this.selNodes[key].oPT.px += this.snap;
          this.selNodes[key].refresh();
        }
        for(let key in this.selGroups){
          this.selGroups[key].sPT.px += this.snap;
          this.selGroups[key].oPT.px += this.snap;
        }
      }else if(v == "D"){
        for(let key in this.selNodes){
          this.selNodes[key].sPT.py += this.snap;
          this.selNodes[key].oPT.py += this.snap;
          this.selNodes[key].refresh();
        }
        for(let key in this.selGroups){
          this.selGroups[key].sPT.py += this.snap;
          this.selGroups[key].oPT.py += this.snap;
        }
      }
      this.drawAll();
    },
    //*********************************************************************************************
  };  
  //************************************************************************* End Of ScreenDesigner



  //***********************************************************************************************
  // 이벤트 연결부
  //***********************************************************************************************
  canvas.addEventListener("click"      , function(e) {  rtn.onClick(e);     });
  canvas.addEventListener("dblclick"   , function(e) {  rtn.onDblClick(e);  });
  canvas.addEventListener("mousedown"  , function(e) {  rtn.onMouseDown(e); });
  canvas.addEventListener("mousemove"  , function(e) {  rtn.onMouseMove(e); });
  canvas.addEventListener("mouseup"    , function(e) {  rtn.onMouseUp(e);   });
  canvas.addEventListener("contextmenu", function(e) {  rtn.contextMenu(e); });
  //***********************************************************************************************

  return rtn;
}
//*************************************************************************************************
