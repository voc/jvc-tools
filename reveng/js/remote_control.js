// Remote Control ////////////
// ズームフェーズ：待機/操作/送信/設定中
var SLIDER = {IDOL:0, CONTROL:1, SEND:2, SETTING:3};
// ズームバー情報
var s_vr_zoom = {
  phase: SLIDER.IDOL,
  start: {val:0, tm:null},
  send : {val:0, tm:null}
}

// ピクセル定義。初期化時に設定。
var gPx = {slider :{base:0, width:0},
           btn    :{base:0, wdith:0}}
// ロック情報
var g_lock = {flag     : false,  // true=ロック/false=アンロック
              setting  : {}};    // ロック設定情報
// カメラステータス
var g_SaveCam = {Status:"Standby", Mode:"Camera", RecMode:"Normal", ZoomStatus:"Idol", ZoomPosition:0, TC:0,
                 SlotA:{Status:"NoSelect", Protect:"Unlock", Remain:0, ClipNum:0},
                 SlotB:{Status:"NoSelect", Protect:"Unlock", Remain:0, ClipNum:0},
                 Battery:{Info:"Time", Level:0, Value:0}, AspectRatio:"16:9"};
var g_bGetFirstCamStatusRemocon = false;
var g_isRecording = false;
// プリセット
var g_preset = new Array({name:'a', pos:-1, color: '#F15A24', dis_color: '#A24D2F', shadow:'0 0 12px #FF8080'},
                         {name:'b', pos:-1, color: '#8CC63F', dis_color: '#5F7C38', shadow:'0 0 12px #80FF80'},
                         {name:'c', pos:-1, color: '#29ABE2', dis_color: '#2E6F8A', shadow:'0 0 12px #80B0FF'});
// スーパー表示フラグ
var g_bDispSI = false;
// コマンド送信フラグ
var g_send = {rec:false, stop:false}

var f_first_status_get = true;  //最初の一回目のステータス取得

var f_camera_control = true;    //カメラコントロール

// 初期化
//表示
function showPageRemocon()
{
  g_web.page_id = 'remocon';  // ページ情報セット

  $('.camctrl')[0].style.display = f_camera_control ? 'block' : 'none';  //カメラコントロール表示/非表示

  // リモコンイベント登録
  $(document)
  .on('click', 'div#disp'      , clickDisp)                    // スーパー消去/表示
  .on('vmousedown vmouseup mouseout', '#btn_rec,  #icon_rec' , clickRec)   // 録画
  .on('vmousedown vmouseup mouseout', '#btn_stop, #icon_stop', clickStop)  // 停止
  .on('click', 'input#btn_lock', clickLock)                    // 操作ロック
  .on('vmousedown vmouseup mouseout', '#btn_wide, #btn_tele' , clickZoom)           // ズーム広角/望遠
  .on('vmousedown vmouseup mouseout', '#btn_preset, #btn_clear', clickPsSetting)      // プリセット保存/削除
  .on('vmousedown vmouseup mouseout', '#btn_ps_a, #icon_ps_a', clickPsA)  // プリセットA
  .on('vmousedown vmouseup mouseout', '#btn_ps_b, #icon_ps_b', clickPsB)  // プリセットB
  .on('vmousedown vmouseup mouseout', '#btn_ps_c, #icon_ps_c', clickPsC)  // プリセットC
  .on('change', 'input#zoom_slider', changeSlider);            // スライダ変更
  
  if (g_ev_rotation) {
    $(window).on(g_ev_rotation, setZoomFactorRemocon);
  } else {
    // PC用
    gPx.slider.base  = g_bMobile ? 51 : 166;
    gPx.slider.width = g_bMobile ? 222 : 270;
  }
  
  CheckOverflowPlMeta();
  
  // 初期化処理
  // ブラウザ別に値を設定
  gPx.btn.size = {};
  $('#select_preset')[0].src = g_bMobile ? '../img/select_preset_mobile.png' : '../img/select_preset_pc.png';
  $('#select_clear')[0].src  = g_bMobile ? '../img/select_clear_mobile.png' : '../img/select_clear_pc.png';
  gPx.btn.size.str = g_bMobile ? '76px 32px' : '70px 35px';
  gPx.btn.size.ps  = g_bMobile ? '76px 32px' : '78px 35px';
  // ボタン基準位置・幅、サイズをスタイルシートから取得
  gPx.btn.base  = PxToN('#btn_ps_a', 'left');
  gPx.btn.width = PxToN('.btn_ps', 'width', 'marginRight');
  // IE8だとbackground-sizeが無効なためエラーになる
  //gPx.btn.size  = {str:PxToN('.btn_str', 'background-size'), 
  //                 ps :PxToN('.btn_ps',  'background-size')};
  
  // 回転検出処理
  // cssのzoom変更によりjQueryMobileのスライダー位置がずれるため、スライダーだけ元のサイズに戻す
  function setZoomFactorRemocon (e)
  {
    if (window.orientation == undefined){
      return;  // PCは対象外
    }
    var page_aspect_ratio = $(window).width() / $(window).height();
    if (page_aspect_ratio >= 1.5) {
      $('div.zoom_slider')[0].style.zoom = 0.8;
      $('#zoom')[0].style.top  = g_bMobile ? '130px' : '85px';
      $('#zoom')[0].style.left = g_bMobile ? ' 50px' : '200px';
      gPx.slider.base  = g_bMobile ? 70 : 190;
      gPx.slider.width = g_bMobile ? 177 : 217;
    } else {
      $('div.zoom_slider')[0].style.zoom = 1;
      $('#zoom')[0].style.top  = g_bMobile ? '107px' : '63px';
      $('#zoom')[0].style.left = g_bMobile ?  '15px' : '128px';
      gPx.slider.base  = g_bMobile ? 51 : 166;
      gPx.slider.width = g_bMobile ? 222 : 270;
    }
    dispPreset();
    e.preventDefault();
  }
    
  initOpnClsMenuRC();  // カメラコントロール開閉メニュー

  initButton();  // カメラコントロールボタン
  
  GetModel(distinctionModelCamCtrl,sessionCamctrl);  //モデル情報を取得しモデル別の処理を実施
  
  // リモコンページ用情報取得
  SendUserData('GetRemocon', null, {
    success: function (data, dataType) {  // コマンド成功
      if (data && data.Session == 'OK') {
        // カメラ名設定保存
        $('#si_name')[0].innerHTML = data.CamName;
        // プリセット設定保存
        for (var i = 0; i < g_preset.length; i++) {
          var data_preset = -1;
          switch (g_preset[i].name) {
            case 'a' : data_preset = data.Preset.A; break;
            case 'b' : data_preset = data.Preset.B; break;
            case 'c' : data_preset = data.Preset.C; break;
          }
          SetPreset(data_preset, i);
        }
        g_lock.setting = data.Lock;  // ロック設定保存
        g_lock.flag  = (g_lock.setting.LockSwitch == 'Lock') ? true:false; 

        dispPreset();   // プリセットボタンソート,マーク表示

        $('#btn_lock')[0].src = g_lock.flag ? '../img/btn_lock.png' : '../img/btn_unlock.png';  // 状態取得できたらボタンアイコン変更、ロックならロック表示
  
      }
      // ステータス取得コマンド開始
      setTimeout(function(){GetStatus(GetStatusRemocon, SessionRimocon);}, 100);
    },
    error: function() {  // 失敗
      DebugMsg(DBGMSG.ERROR, 'GetRemocon Error');
    }
  });

}

// カメラステータス取得
var f_zoom_status_enable = false;
var f_zoom_preset_enable = false;
var f_zoom_clear_enable = false;
var f_zoom_preset1_enable = false;
var f_zoom_preset2_enable = false;
var f_zoom_preset3_enable = false;
var f_zoom_tele_enable = false;
var f_zoom_wide_enable = false;
var f_zoom_slider_enable = false;

var f_zoom_full_scale = true;

//ズームスケール値
var SLIDER_SCALE = {
  MIN      :0,    //最小値
  MOVABLE  :499,   //可動域 後で値を入れ替える
  MAX      :499   //最大値
};

function GetStatusRemocon(data)
{
  //ライブビューの画角を変更するために取得
  if(data.AspectRatio == '16:9'){
    live_ratio = 0;    //16:9
  }else{
    live_ratio = 1;    //4:3
  }

    // ズームの有効無効
    f_zoom_status_enable = (data.Enable.Zoom.Status) ? true : false;
    f_zoom_preset_enable = (data.Enable.Zoom.Preset) ? true : false;
    f_zoom_clear_enable = (data.Enable.Zoom.Clear) ? true : false;
    f_zoom_preset1_enable = (data.Enable.Zoom.Preset1) ? true : false;
    f_zoom_preset2_enable = (data.Enable.Zoom.Preset2) ? true : false;
    f_zoom_preset3_enable = (data.Enable.Zoom.Preset3) ? true : false;
    f_zoom_tele_enable = (data.Enable.Zoom.Tele) ? true : false;
    f_zoom_wide_enable = (data.Enable.Zoom.Wide) ? true : false;

    f_zoom_slider_enable = ((data.Enable.Zoom.Tele)&&(data.Enable.Zoom.Wide)) ? true : false;
  
  if(mft_lens_limit_flag == true){          //MFTレンズ制限対応
    //ズームの情報を毎回反映する
    DispControl((g_lock.flag == false) ? true : false);  // コントロールのロック表示
    dispPresetSetMode(g_bPresetSetMode  & f_zoom_preset_enable);
    dispPresetClearMode(g_bPresetClearMode  & f_zoom_clear_enable & isRegistPreset());
  }

  //ズーム（ダイナミック）
  if(dynamic_zoom_effective_flag){    //ダイナミックズーム機能あり
    var img_left = gPx.slider.base + parseInt(data.ZoomDynamicPos * gPx.slider.width / SLIDER_SCALE.MAX);
    $('#img_dynamic_pos')[0].style.left = img_left + 'px';  //data.ZoomDynamicPosに線を引く
    if(data.ZoomStatus == 'On'){  //ダイナミックズームオン
      f_zoom_full_scale = true;
      SLIDER_SCALE.MOVABLE = SLIDER_SCALE.MAX;  //可動範囲制限無し
      $('#img_dynamic_pos')[0].src = 'img/mark_dynamic.png';
      $('#img_dynamic_pos')[0].style.visibility = (b_zoom_unlock) ? 'visible':'hidden';
      $('#dynamic_slider')[0].style.visibility = 'hidden';
      for (var i = 0; i < g_preset.length; i++) {  //全てのプリセットを表示
        if(g_preset[i].pos >= 0 ){  //消去されているときはポジション０
          DispPsBtn((b_zoom_unlock & f_zoom_preset_enable), g_preset[i]);  // ロック時またはプリセット設定時に表示変更
          $('#img_ps_' + g_preset[i].name)[0].style.visibility = (b_zoom_unlock & f_zoom_preset_enable) ? 'visible':'hidden';
        }
      }
      
    }else{  //ダイナミックズームオフ
      f_zoom_full_scale = false;
      SLIDER_SCALE.MOVABLE = data.ZoomDynamicPos;  //可動範囲を制限
      //スライダーを短く
      $('#img_dynamic_pos')[0].style.visibility = 'hidden';
      $('#dynamic_slider')[0].style.visibility = 'visible';
      //範囲外のプリセットを無効に
      for (var i = 0; i < g_preset.length; i++) {
        if(g_preset[i].pos > SLIDER_SCALE.MOVABLE){  //可動範囲を超えていたら
          if(g_bPresetSetMode || g_bPresetClearMode){  //プリセットモード・クリアモード時は表示
            if(g_preset[i].pos >= 0 ){
              DispPsBtn((b_zoom_unlock & f_zoom_preset_enable), g_preset[i]);  // ロック時またはプリセット設定時に表示変更
              $('#img_ps_' + g_preset[i].name)[0].style.visibility = (b_zoom_unlock & f_zoom_preset_enable) ? 'visible':'hidden';
            }
          }else{  //通常時は非表示
            DispPsBtn(false, g_preset[i]);  //ボタンをグレー
            $('#img_ps_' + g_preset[i].name)[0].style.visibility = 'hidden';  //マークを消去
          }
        }else{  //可動範囲内であれば表示
          if(g_preset[i].pos >= 0 ){
            DispPsBtn((b_zoom_unlock & f_zoom_preset_enable), g_preset[i]);  // ロック時またはプリセット設定時に表示変更
            $('#img_ps_' + g_preset[i].name)[0].style.visibility = (b_zoom_unlock & f_zoom_preset_enable) ? 'visible':'hidden';
          }
        }
      }
    }
  }else{
    f_zoom_full_scale = true;
    $('#img_dynamic_pos')[0].style.visibility = 'hidden';
    $('#dynamic_slider')[0].style.visibility = 'hidden';
  }


    if(f_first_status_get){  //最初のステータス取得時に表示
      DispControl((g_lock.flag == false) ? true : false); // ロック中にステータスが変わった場合は表示変更
      f_first_status_get = false;
    }

  // ステータス
  if (data.Status != g_SaveCam.Status) {
    var icon, str, color, b_rec;
    switch (data.Status) {
      case 'NoCard'  : icon ='stop';   str ='----'; color ='white';  b_rec = false; break;  // カード無し
      case 'Stop'    : icon ='stop';   str ='STOP'; color ='white';  b_rec = false; break;  // 停止(アクティブスロットMedia End)
      case 'Rec'     : icon ='rec';    str ='REC';  color ='red';    b_rec = true;  break;  // 録画
      case 'RecPause': icon ='stby_y'; str ='STBY'; color ='yellow'; b_rec = true;  break;  // 一時停止(Frame Rec)
      case 'Standby' :
      default        : icon ='stby_w'; str ='STBY'; color ='white';  b_rec = false; break;  // 停止
    }
    $('#si_status_icon' )[0].src = '../img/'+icon+'.gif';
    $('#si_status_txt'  )[0].innerHTML = str;
    $('#si_status_txt'  )[0].style.color =
    $('#si_rec_mode_txt')[0].style.backgroundColor = color;

    if (g_isRecording != b_rec) {  //記録状態が変わった
      g_isRecording = b_rec;
      DispControl((g_lock.flag == false) ? true : false); // ロック中にステータスが変わった場合は表示変更
    }
  }
  // 録画モード
  if (data.RecMode != g_SaveCam.RecMode) {
    var str, display;
    switch (data.RecMode) {
      case 'Pre'     : str = 'P'; display = 'block'; break;
      case 'Clip'    : str = 'C'; display = 'block'; break;
      case 'Frame'   : str = 'F'; display = 'block'; break;
      case 'Interval': str = 'I'; display = 'block'; break;
      case 'Variable': str = 'V'; display = 'block'; break;
      case 'Normal'  : 
      default        : str = ''; display = 'none'; break;
    }
    $('#si_rec_mode_txt')[0].innerHTML     = str;
    $('#si_rec_mode_txt')[0].style.display = display;
  }
  // タイムコード
  if (data.TC != g_SaveCam.TC) {
    // 表示
    $('#si_tc_txt')[0].innerHTML = data.TC;
  }

  // ズーム(スライダーバー)位置情報からバーを移動する処理
  if (s_vr_zoom.phase == SLIDER.IDOL) {
    if (data.ZoomPosition != g_SaveCam.ZoomPosition) {
      DebugMsg(DBGMSG.ZOOM, 'SLIDER diffarent position lens before='+ g_SaveCam.ZoomPosition +' now='+ data.ZoomPosition);
      // スライダー位置設定
      s_vr_zoom.phase = SLIDER.SETTING;
      $('input#zoom_slider')[0].value = data.ZoomPosition;
      $('input#zoom_slider').slider('refresh');
    }
  }
  if (s_vr_zoom.phase == SLIDER.SEND) {
    // 送信後は送信値と同じ値をステータスから取得するまでスライダーを移動させない。
    // 同時に本体でズームが発生すると同じ値が返らないのでタイムアウトを設けてある
    if(dynamic_zoom_effective_flag){    //ダイナミックズーム機能あり CG14Aの判定に使用
      DebugMsg(DBGMSG.ZOOM, 'SLIDER.SEND send='+ s_vr_zoom.send.val +' res='+ data.ZoomPosition +' slider='+ $('input#zoom_slider')[0].value);
      if (data.ZoomPosition == s_vr_zoom.send.val) {
        clearTimeout(s_vr_zoom.send.tm);  // タイムアウトクリア
        s_vr_zoom.send.tm = null;
        if (s_vr_zoom.send.val != $('input#zoom_slider')[0].value) {
          // スライダーが移動していたら再度コマンドを送る
          DebugMsg(DBGMSG.ZOOM, '>>>>> call SendZoom() in  SLIDER.SEND val=' + $('input#zoom_slider')[0].value);
          SendZoom();
        } else {
          // 状態をIDOLにしてGetCamStatusによる位置設定を可能にする
          DebugMsg(DBGMSG.ZOOM, 'SLIDER same position slider to final > IDOL slider=' + $('input#zoom_slider')[0].value + ' final=' + s_vr_zoom.send.val);
          s_vr_zoom.phase    = SLIDER.IDOL;
          s_vr_zoom.start.val = s_vr_zoom.send.val;
        }
      }
    }else{    //ダイナミックズーム機能なし CG16Aの判定に使用
      DebugMsg(DBGMSG.ZOOM, 'SLIDER wait for reach final='+ s_vr_zoom.send.val +' lens='+ data.ZoomPosition +' slider='+ $('input#zoom_slider')[0].value);

      var mecha_reached_a_send_position = false;
      var slider_is_same_as_send_position = false;
      if(mft_lens_limit_flag == true){          //MFTレンズ制限対応
        var mecha_diff = Math.abs(s_vr_zoom.send.val - data.ZoomPosition);  //レンズと指定位置の差を絶対値にする
        if ( mecha_diff <= 16) {  //階調が少ないので前後16くらいは許す
          mecha_reached_a_send_position = true;
        }else{
          mecha_reached_a_send_position = false;
        }
      
        var slider_diff = Math.abs(s_vr_zoom.send.val - $('input#zoom_slider')[0].value);  //スライダーと指定位置の差を絶対値にする
        if ( slider_diff <= 16) {  ///階調が少ないので前後16くらいは許す
          slider_is_same_as_send_position = true;
        }else{
          slider_is_same_as_send_position = false;
        }
        DebugMsg(DBGMSG.ZOOM, 'SLIDER MFT lens final=' + s_vr_zoom.send.val + ' lens=' + data.ZoomPosition + ' slider=' + $('input#zoom_slider')[0].value);
      }else{
        if (data.ZoomPosition == s_vr_zoom.send.val) {  //レンズが指定位置に到達した
          mecha_reached_a_send_position = true;
        }else{
          mecha_reached_a_send_position = false;
        }
        
        if (s_vr_zoom.send.val != $('input#zoom_slider')[0].value) {  //スライダーが指定位置から移動している
          slider_is_same_as_send_position = false;
        }else{
          slider_is_same_as_send_position = true;
        }
        DebugMsg(DBGMSG.ZOOM, 'SLIDER BIN lens final=' + s_vr_zoom.send.val + ' lens=' + data.ZoomPosition + ' slider=' + $('input#zoom_slider')[0].value);
      }
  //    if (data.ZoomPosition == s_vr_zoom.send.val) {
      if (mecha_reached_a_send_position == true){  //レンズが指定位置に到達した
        DebugMsg(DBGMSG.ZOOM, 'SLIDER same position lens to final position lens=' + data.ZoomPosition + ' final=' + s_vr_zoom.send.val);
        clearTimeout(s_vr_zoom.send.tm);  // タイムアウトクリア
        s_vr_zoom.send.tm = null;
  //      if (s_vr_zoom.send.val != $('input#zoom_slider')[0].value) {  // スライダーが移動していたら再度コマンドを送る
        if (slider_is_same_as_send_position == false) {  // スライダーが移動していたら再度コマンドを送る
          DebugMsg(DBGMSG.ZOOM, 'SLIDER diffarent position slider to final slider=' + $('input#zoom_slider')[0].value + ' final=' + s_vr_zoom.send.val);
          SendZoom();
        } else {
          // 状態をIDOLにしてGetCamStatusによる位置設定を可能にする
          DebugMsg(DBGMSG.ZOOM, 'SLIDER same position slider to final > IDOL slider=' + $('input#zoom_slider')[0].value + ' final=' + s_vr_zoom.send.val);
          s_vr_zoom.phase    = SLIDER.IDOL;
          s_vr_zoom.start.val = s_vr_zoom.send.val;
        }
      }
    }
  }
  // ズーム(EE表示)
  if (data.ZoomDisplayValue != g_SaveCam.ZoomDisplayValue){
//      $('#si_zoom')[0].innerHTML =  'Z'+ ('00'+ parseInt(data.ZoomDisplayValue)).slice(-3);  // EE表示変更
      $('#si_zoom')[0].innerHTML =  data.ZoomDisplayValue;  // EE表示変更
  }
  $('.ui-slider-handle')[0].title = '';

  // スロットA/B
  if (data.SlotA != g_SaveCam.SlotA){
    dispSlot(data.SlotA, 'A');
  }
  if (data.SlotB != g_SaveCam.SlotB){
    dispSlot(data.SlotB, 'B');
  }
  // バッテリー
  if (data.Battery != g_SaveCam.Battery) {
    if (0 <= data.Battery.Level && data.Battery.Level <= 14) {
      // バッテリーアイコン
      $('#si_battery_icon')[0].src = '../img/pwr'+ data.Battery.Level +'.png';
      $('#si_battery_icon')[0].onload = function () {
        // そのまま表示すると前回の画像が表示されるためonload完了後に表示
        if (g_bDispSI){
          $('#si_battery_icon')[0].style.visibility = 'visible';
        }
      }
      // バッテリー値。AC接続や読取不可時、表示「切り」時(Value=0)は表示を消す
      var str = '';
      var BatteryWarn = 0;
      if (((data.Battery.Level != 1)&&(data.Battery.Level != 2)) && data.Battery.Value > 0) {
        if(data.Battery.Value==0xffff){
          BatteryWarn = 1;
          str = 'RES';  //残量ワーニング表示（新アイコン）
        }else if((data.Battery.Value>=1000)&&(data.Battery.Value < 0xffff)){
          BatteryWarn = 0;
          str = '';    //残量取得不可のため表示なし（新アイコン）
        }else{
          BatteryWarn = 0;
          switch (data.Battery.Info) {
            case 'Capacity' : str = data.Battery.Value +'%';                 break;
            case 'Voltage'  : str = (data.Battery.Value/10).toFixed(1) +'V'; break;
            case 'Time'     : str = data.Battery.Value +'min';               break;
            default         : break;
          }
        }
      }
      $('#si_battery_txt')[0].innerHTML = str;
      $('#si_battery_txt')[0].style.color = (BatteryWarn == 0) ? 'white':'yellow';
    } else {
      // 読取不可時は表示を消す
      $('#si_battery_icon')[0].style.visibility = 'hidden';
      $('#si_battery_txt')[0].innerHTML = '';
    }
  }
  // 値を保存
  g_SaveCam          = data;  // カメラステータス
  g_web.allowed_page = data.AllowedPage;  // 現在の各ページ許可の状態
   
   
  // 最初の更新
  if (g_bGetFirstCamStatusRemocon == false) {
    g_bGetFirstCamStatusRemocon = true;
    dispSI(true);  // ステータス表示
    setTimeout(LiveView, 100);    // 動画取得CGIを実行する
  }
 
  getStatusCamctrl(data);


}
// リモコンページセッション更新
function SessionRimocon(data)
{
  g_bUpdateLifeTime = true;  // このページでは常にlifetimeを更新する
  
  if (data.ViewTimeout && data.ViewTimeout == 'True') {
    // mjpeg.cgiがタイムアウトしている場合は再ロードしてみる
    $('img#ee')[0].src = undefined;
    setTimeout(LiveView, 1000);
  }
  if (data.CamName && data.CamName != $('#si_name')[0].innerHTML){
    $('#si_name')[0].innerHTML = data.CamName;  // カメラ名が変わった場合
  }
}


// スロット表示関数
function dispSlot(Slot, slot_name)
{
  var icon_name, str;
  switch (Slot.Status) {
    case 'Select'     : icon_name = 'on';      break;
    case 'SelectRec'  : icon_name = 'on_rec';  break;
    case 'NoSelect'   : icon_name = 'off';     break;
    case 'NoSelectRec': icon_name = 'off_rec'; break;
    case 'Invalid'    : icon_name = 'off';     break;
    case 'NoCard'     :
    default           : icon_name = 'off';     break;
  }
  if (Slot.Status == 'Invalid'){
    str = '!INVALID';
  }else if (Slot.Protect == 'Lock'){
    str = '';
  }else if (Slot.Status == 'NoCard' || Slot.Status == 'Unknown' || Slot.Remain < 0){
    str = '----min';
  }else{
    str = (parseInt(Slot.Remain) < 1000 ? Slot.Remain : 999) +'min';
  }
  // 表示
  $('#si_slot'+ slot_name +'_icon')[0].src      = '../img/slot'+ slot_name +'_'+ icon_name +'.png';
  $('#si_slot'+ slot_name +'_txt')[0].innerHTML = str;
  $('#si_slot'+ slot_name +'_txt')[0].style.color = (Slot.RemainWarn == 0) ? 'white':'yellow';
  $('#si_slot'+ slot_name +'_protect')[0].style.display = (Slot.Protect == 'Lock') ? 'block':'none';
}

// プリセット保存表示
function dispPresetSetMode(b_select)
{
  // プリセットボタンdisable設定
  for (var i = 0; i < g_preset.length; i++) {
    var name ='btn_ps_'+ g_preset[i].name;
    if (b_select == true) { // 表示時
//      if (g_lock.flag == false){  //ロックされていなかったら、ABCボタン表示
      if (b_zoom_unlock == true){  //ズームロックされていなかったら、ABCボタン表示
        DispPsBtn(true, g_preset[i]);
      }
    } else if (g_preset[i].pos < 0) { // 非表示時で設定値なし
      DispPsBtn(false, g_preset[i]);
    }
  }
  //表示
  $('#select_preset')[0].style.visibility = b_select ? 'visible' : 'hidden';  //青帯
  if (b_zoom_unlock & f_zoom_preset_enable){  //ズームロックされていなかったら、ABCボタン表示
    var back_png = b_select ? 'btn_back_sel.png' : 'btn_back.png';
    if ($('#btn_preset').css('backgroundImage').indexOf(back_png) < 0)
      $('#btn_preset')[0].style.backgroundImage = b_select ? 'url(../img/btn_back_sel.png)' : 'url(../img/btn_back.png)';
    if (g_bMobile == false) {  // PCではClearボタン非表示
      $('#btn_clear')[0].style.visibility = b_select ? 'hidden' : 'visible';
    }
    $('#btn_preset')[0].style.backgroundSize = gPx.btn.size.str;
  }
}
// プリセット削除表示
function dispPresetClearMode(b_select)
{
  $('#select_clear')[0].style.visibility = b_select ? 'visible' : 'hidden';  //青帯
  if (b_zoom_unlock & f_zoom_clear_enable){  //ズームロックされていなかったら、ABCボタン表示
    var back_png = b_select ? 'btn_back_sel.png' : 'btn_back.png';
    if (($('#btn_clear').css('backgroundImage').indexOf(back_png) < 0)
      &&($('#btn_clear').css('backgroundImage').indexOf('btn_back_dis.png') < 0)){
      $('#btn_clear')[0].style.backgroundImage = b_select ? 'url(../img/btn_back_sel.png)' : 'url(../img/btn_back.png)';
    }
  }
}
// プリセット保存/削除
var g_bPresetSetMode = false;    //プリセット設定モード
var g_bPresetClearMode = false;  //プリセットクリアモード

function clickPsSetting(e)
{  //プリセットもクリアもこの関数
  e.preventDefault();
  var ret = changeClickBtnColor('back', e.handleObj.origType, '#'+ this.id, gPx.btn.size.str);
  if (ret == false){
    return;
  }
  var btn_around = '';
  var btn_id     = '';
  if (this.id == 'btn_preset') {  //プリセットボタン
    if (g_bPresetClearMode == true) {  // クリア選択時はクリア非表示
      dispPresetClearMode(false);
      g_bPresetClearMode = false;
    }
    // プリセット非選択時は選択に、選択時は非選択に
    g_bPresetSetMode = !g_bPresetSetMode;
    dispPresetSetMode(g_bPresetSetMode);
  } else {  //クリアボタン
    if (g_bPresetSetMode == true) {  // プリセット選択時はプリセット非表示
      dispPresetSetMode(false);
      g_bPresetSetMode = false;
    }
    // クリア非選択時は選択に、選択時は非選択に
    g_bPresetClearMode = !g_bPresetClearMode;
    dispPresetClearMode(g_bPresetClearMode);
  }

  DispControl((g_lock.flag == false) ? true : false);  //ボタン状態の再表示

}
// プリセットABCボタン
var g_sSaveShadow = '';
function clickPsA(e){ clickPsBtn('a', e); }
function clickPsB(e){ clickPsBtn('b', e); }
function clickPsC(e){ clickPsBtn('c', e); }
function clickPsBtn(name, e)
{
  e.preventDefault();  // これが無いとアップダウンと同時にスクロールした時マウスアップを拾えない
  
  var ret = changeClickBtnColor('ps_back', e.handleObj.origType, '#btn_ps_'+ name, gPx.btn.size.ps);
  if (ret == false){
    return;
  }
  //プリセットボタン判定
  var select_index = -1;
  if (name == g_preset[0].name){
    select_index = 0;
  }else if (name == g_preset[1].name){
    select_index = 1;
  }else if (name == g_preset[2].name){
    select_index = 2;
  }else{
    return;
  }
  if (g_bPresetSetMode) {
    var slider_val = parseInt($('input#zoom_slider')[0].value);  // 保存は現在のスライダー値
    // 送信文字列作成を作成し、ユーザデータ送信
    var param = 'ID='+ g_preset[select_index].name +'&pos='+ slider_val;
    SendUserData('SetPreset', param, {
      success: function (data, dataType) {  // 応答成功。送信値設定
        SetPreset(slider_val, select_index);  // プリセット位置画像の表示とボタンのenable
        dispPreset();          // ボタン位置設定
      }
    });
  } else if (g_bPresetClearMode) {
    // 送信文字列作成を作成し、ユーザデータ送信
    var param = 'ID='+ g_preset[select_index].name +'&pos=-1';
    SendUserData('SetPreset', param, {
      success: function (data, dataType) {  // 応答成功。送信値設定
        SetPreset(-1, select_index);  // プリセット位置画像を非表示とボタンをdisenable
        DispControl((g_lock.flag == false) ? true : false);   //ボタン状態の再表示
      }
    });
  } else {
    // 移動
    var slider_val = g_preset[select_index].pos;
    if (slider_val >= 0) {  // 値がある場合はスライダー移動
      SendPSZoom(slider_val);
//      // スライダー反映
//      DebugMsg(DBGMSG.ZOOM, '$$$ preset button ' + select_index + ' val=' + $('input#zoom_slider')[0].value);
//      $('input#zoom_slider')[0].value = slider_val;
//      $('input#zoom_slider').slider('refresh');
    }
  }

}
// プリセット設定/削除
function SetPreset(val, index)
{
  if (val >= 0) {
    // 設定
    g_preset[index].pos = val;
    $('#img_ps_'+ g_preset[index].name)[0].style.visibility = 'visible';
    if (g_lock.flag == false){
      DispPsBtn(true, g_preset[index])  // ロック中以外は表示する
    }
    // スライダーと一致した時は影変更
    if (g_preset[index].pos == $('input#zoom_slider')[0].value) {
      g_sSaveShadow = g_preset[index].shadow
      $('.zoom_slider .ui-btn, .ui-btn:focus')[0].style.boxShadow       = g_sSaveShadow;
      $('.zoom_slider .ui-btn, .ui-btn:focus')[0].style.WebkitBoxShadow = g_sSaveShadow;
    }
  } else {
    // スライダーと一致した時は影変更
    if (g_preset[index].pos == $('input#zoom_slider')[0].value) {
      g_sSaveShadow = '';
      $('.zoom_slider .ui-btn, .ui-btn:focus')[0].style.boxShadow       = g_sSaveShadow;
      $('.zoom_slider .ui-btn, .ui-btn:focus')[0].style.WebkitBoxShadow = g_sSaveShadow;
    }
    // 削除
    g_preset[index].pos = -1;
    DispPsBtn(false, g_preset[index])
    $('#img_ps_'+ g_preset[index].name)[0].style.visibility = 'hidden';
  }
}
// プリセット位置画像、ボタンの位置設定
function dispPreset()
{
  // プリセット情報配列ソート
  g_preset.sort(function(a, b) {
    if (a['pos'] < 0 && b['pos'] < 0){
      return (a['name'] < b['name']) ? -1 : 1;  // お互いに-1の場合は名前順
    }else if (a['pos'] < 0){
      return  1;  // 自分が-1は後
    }else if (b['pos'] < 0){
      return -1;  // 相手が-1は前
    }else{
      return a['pos'] - b['pos'];  // お互いに値がある場合は降順
    }
  });
  // プリセット位置画像、ボタンの位置設定
  for (var i = 0; i < g_preset.length; i++) {
    if (g_preset[i].pos >= 0) {
      var img_left = gPx.slider.base + parseInt(g_preset[i].pos * gPx.slider.width / SLIDER_SCALE.MAX);
      // 重なりチェック
      if (i >= 1 && g_preset[i].pos == g_preset[i - 1].pos){
        img_left += 5;
      }
      if (i >= 2 && g_preset[i].pos == g_preset[i - 2].pos){
        img_left += 5;
      }
      // プリセット位置画像位置設定
      $('#img_ps_'+ g_preset[i].name)[0].style.left = img_left + 'px';
    }
    // ボタン位置設定
    $('#btn_ps_'+ g_preset[i].name)[0].style.left  = 
    $('#icon_ps_'+ g_preset[i].name)[0].style.left = gPx.btn.base + gPx.btn.width * i + 'px';
  }
}
// 画面クリック
function clickDisp()
{
  dispSI(!g_bDispSI);
}
// 画面ステータス表示
function dispSI(b_disp)
{
  $('#si_name'   )[0].style.visibility = 
  $('#si_tc'     )[0].style.visibility = 
//  $('#si_zoom'   )[0].style.visibility = 
  $('#si_slotA'  )[0].style.visibility = 
  $('#si_slotB'  )[0].style.visibility = 
  $('#si_status' )[0].style.visibility = 
  $('#si_battery')[0].style.visibility = 
  $('#si_battery_icon')[0].style.visibility = (b_disp == true) ? 'visible' : 'hidden';
  
  if(f_zoom_status_enable){
    $('#si_zoom')[0].style.visibility = (b_disp == true) ? 'visible' : 'hidden';
  }else{
    $('#si_zoom')[0].style.visibility = 'hidden';
  }
  
  g_bDispSI = b_disp;
}
// 録画ボタンクリック
function clickRec(e)
{
  e.preventDefault();
  
  // ボタン色変更
  var ret = changeClickBtnColor('back', e.handleObj.origType, '#btn_rec', gPx.btn.size.str);
  if (ret == false){
    return;
  }
  if (s_vr_zoom.phase != SLIDER.IDOL){
    if(f_zoom_wide_enable | f_zoom_tele_enable){  //ズーム不可レンズ時は（両方false）記録ボタンに影響させない
      return;  // スライダー停止中のみ送信
    }
  }
  if (g_SaveCam.Status == 'NoCard') {
    showPopup('NoSDCardAtRec');  // カードが無い場合は警告を出して終了
    return;
  }
  if (g_SaveCam.Status == 'Stop') {
  //if (g_SaveCam.Status == 'Stop' && (g_SaveCam.SlotA.Protect == 'Lock' || g_SaveCam.SlotB.Protect == 'Lock')) {
    showPopup('DisablePreparRec');  // 警告表示
    return;
  }
  // コマンド送信
  SendRec();
}
// 録画コマンド送信
function SendRec()
{
  if (g_send.rec == true){  // 送信フラグ確認
    return;
  }
  g_send.rec = true;  // 送信フラグ設定
  // コマンド送信
  SendCommand('SetCamCtrl', {'CamCtrl':'Rec'}, {
    success : function (data) {
      g_send.rec = false;
      if (checkResCommand(data, {func:SendRec, time:100}) == false){  // コマンド応答チェック
        return;
      }
    },
    error : function () {
      g_send.rec = false;  // エラーでもフラグを落とす
    }
  });
}
// 停止ボタンクリック
function clickStop(e)
{
  e.preventDefault();
  
  // ボタン色変更
  var ret = changeClickBtnColor('back', e.handleObj.origType, '#btn_stop', gPx.btn.size.str);
  if (ret == false){
    return;
  }
  if (s_vr_zoom.phase != SLIDER.IDOL){
    if(f_zoom_wide_enable | f_zoom_tele_enable){  //ズーム不可レンズ時は（両方false）記録ボタンに影響させない
      return;  // スライダー停止中のみ送信
    }
  }
  // コマンド送信
  SendStop();
}
// 停止コマンド送信
function SendStop()
{
  if (g_send.stop == true){  // 送信フラグ確認
    return;
  }
  g_send.stop = true;  // 送信フラグ設定
  // コマンド送信
  SendCommand('SetCamCtrl', {'CamCtrl':'Stop'}, {
    success : function (data) {
      g_send.stop = false;
      if (checkResCommand(data, {func:SendStop, time:100}) == false){  // コマンド応答チェック
        return;
      }
    },
    error : function () {
      g_send.stop = false;  // エラーでもフラグを落とす
    }
  });
}
// ズーム
function clickZoom(e)
{
  e.preventDefault();
  var ret = changeClickBtnColor('back', e.handleObj.origType, '#'+ this.id, gPx.btn.size.str);
  if (ret == false){
    return;
  }
  var slide_val = parseInt($('input#zoom_slider')[0].value);
  if (this.id == 'btn_wide') {  // 広角
    if (slide_val <= 0)
      return
    slide_val--;
  } else {  // 望遠
    if (slide_val >= SLIDER_SCALE.MOVABLE)
//    if (slide_val >= SLIDER_SCALE.MAX)
      return;
    slide_val++;
  }
  $('input#zoom_slider')[0].value = slide_val;
  $('input#zoom_slider').slider('refresh');
}
// ロックボタンクリック
function clickLock()
{
    DispControl(g_lock.flag);  // コントロールのロック表示
    $('#btn_lock')[0].src = g_lock.flag ? '../img/btn_unlock.png' : '../img/btn_lock.png';  // ボタンアイコン変更 ロックならアンロックになる
    g_lock.flag = g_lock.flag ? false : true;  //状態入れ替え
    //プリセット・クリアー選択状態の再表示
    dispPresetSetMode(g_bPresetSetMode  & f_zoom_preset_enable);
    dispPresetClearMode(g_bPresetClearMode  & f_zoom_clear_enable & isRegistPreset());
//    $('#select_preset')[0].style.visibility = (b_zoom_unlock & f_zoom_preset_enable & g_bPresetSetMode) ? 'visible' : 'hidden';  //青帯
//    $('#btn_preset')[0].style.backgroundImage = g_lock.flag ? 'url(../img/btn_back_dis.png)' : (g_bPresetSetMode ? 'url(../img/btn_back_sel.png)' : 'url(../img/btn_back.png)');
//    $('#select_clear')[0].style.visibility = (b_zoom_unlock & f_zoom_clear_enable & isRegistPreset() & g_bPresetClearMode) ? 'visible' : 'hidden';  //青帯
//    $('#btn_clear')[0].style.backgroundImage = g_lock.flag ? 'url(../img/btn_back_dis.png)' : (g_bPresetClearMode ? 'url(../img/btn_back_sel.png)' : 'url(../img/btn_back.png)');
    
    //LockSwitchをユーザーデータに覚える
    g_lock.setting.LockSwitch  = (g_lock.flag == true) ? 'Lock':'NoLock'; 
    // ViewRemote情報取得コマンド送信
  var param = {Name    : $('#si_name')[0].innerHTML,
               LockSwitch: (g_lock.setting.LockSwitch  == 'Lock') ? '1' : '0',
               RecStart: (g_lock.setting.StandbyRec  == 'Lock') ? '1' : '0',
               StbyZoom: (g_lock.setting.StandbyZoom == 'Lock') ? '1' : '0',
               StbyControl: (g_lock.setting.StandbyControl == 'Lock') ? '1' : '0',
               RecStop: (g_lock.setting.RecStop == 'Lock') ? '1' : '0',
               RecZoom: (g_lock.setting.RecZoom == 'Lock') ? '1' : '0',
               RecControl: (g_lock.setting.RecControl == 'Lock') ? '1' : '0'}
  SendSettings('SetVRSettings', param, {
    success: function (data, dataType) {
      if (checkResSetting(data) == false) {
        showPopup('NoResponse');
        return;
      }
    }
  });
    
}
// コントロール表示
var b_control_unlock; //カメラコントロール関連
var b_rec_unlock; //録画関係コントロール
var b_zoom_unlock; //ズーム関連コントロール
function DispControl(b_unlock)
{
  if (b_unlock) {  // 許可(ロック解除)
    b_rec_unlock  = true;
    b_zoom_unlock = true;
    b_control_unlock = true;
  } else {  // 禁止(ロック)
    if (g_isRecording == true) {  // 録画中
      b_rec_unlock  = (g_lock.setting.RecStop == 'Lock') ? false : true; 
      b_zoom_unlock = (g_lock.setting.RecZoom == 'Lock') ? false : true; 
      b_control_unlock = (g_lock.setting.RecControl == 'Lock') ? false : true; 
    } else {  // 録画中以外
      b_rec_unlock  = (g_lock.setting.StandbyRec  == 'Lock') ? false : true; 
      b_zoom_unlock = (g_lock.setting.StandbyZoom == 'Lock') ? false : true; 
      b_control_unlock = (g_lock.setting.StandbyControl == 'Lock') ? false : true; 
    }
  }

  // 録画関係表示
  $('#icon_rec')[0].src  = b_rec_unlock ? 'img/btn_icon_rec.png' : 'img/btn_icon_rec_dis.png';
  $('#icon_stop')[0].src = b_rec_unlock ? 'img/btn_icon_stop.png' : 'img/btn_icon_stop_dis.png';
  DispStrBtn(b_rec_unlock, 'rec' );
  DispStrBtn(b_rec_unlock, 'stop');
  
  // ズーム関係表示
  DispStrBtn((b_zoom_unlock & f_zoom_preset_enable), 'preset');
  DispStrBtn((b_zoom_unlock & f_zoom_clear_enable), 'clear');
  DispStrBtn((b_zoom_unlock & f_zoom_wide_enable), 'wide');
  DispStrBtn((b_zoom_unlock & f_zoom_tele_enable), 'tele');
  // ズームプリセットlimit
  for (var i = 0; i < g_preset.length; i++) {
    // マーク
    if (g_preset[i].pos >= 0){
      $('#img_ps_' + g_preset[i].name)[0].style.visibility = (b_zoom_unlock & f_zoom_preset_enable) ? 'visible':'hidden';
    }
    // ABCボタン
    if (b_zoom_unlock == false || g_preset[i].pos >= 0){
      DispPsBtn((b_zoom_unlock & f_zoom_preset_enable), g_preset[i]);  // ロック時またはプリセット設定時に表示変更
    }
  }
  if(dynamic_zoom_effective_flag){    //ダイナミックズーム機能あり
    $('#img_dynamic_pos')[0].style.visibility = (b_zoom_unlock) ? 'visible':'hidden';  //ダイナミックズーム境界
  }
  // スライダー
  $('#zoom_slider').slider((b_zoom_unlock & f_zoom_wide_enable & f_zoom_tele_enable) ? 'enable' : 'disable');
  $('div.zoom_slider .ui-slider-handle')[0].style.visibility = (b_zoom_unlock & f_zoom_wide_enable & f_zoom_tele_enable) ? 'visible' : 'hidden';
  
  if(g_bPresetSetMode){    //プリセット設定モード
    $('#select_preset')[0].style.visibility = (b_zoom_unlock & f_zoom_preset_enable) ? 'visible' : 'hidden';
  }
  if(g_bPresetClearMode){  //プリセットクリアモード
    $('#select_clear')[0].style.visibility = (b_zoom_unlock & f_zoom_clear_enable & isRegistPreset()) ? 'visible' : 'hidden';
  }

  //カメラコントロール関係表示
  //ロック時はタブを閉じ操作不可状態（文字色グレー、タップ不可）に
  //ロック解除時はタブを閉じたままで操作可能状態
  if(!b_control_unlock){
    //ロック時はタブを閉じる
    $('#blk_ctrl_camera')[0].style.display =
    $('#blk_ctrl_focus')[0].style.display =
    $('#blk_ctrl_usersw')[0].style.display =
    $('#blk_ctrl_disptv')[0].style.display = 'none';  // ブロック表示/消去
    //アイコンを閉じのグレー表示
    $('#clk_icon_camera')[0].src =
    $('#clk_icon_focus')[0].src =
    $('#clk_icon_usersw')[0].src =
    $('#clk_icon_disptv')[0].src =  'img/icon_list_close_dis.png';
    //ラベルをグレー表示
    $('#clk_lbl_camera')[0].style.color =
    $('#clk_lbl_focus')[0].style.color =
    $('#clk_lbl_usersw')[0].style.color =
    $('#clk_lbl_disptv')[0].style.color ='grey';

  }else{
    //開閉状態を復帰
    $('#blk_ctrl_camera')[0].style.display = GetCookie('#blk_click_camera') == 'open' ? 'block' : 'none';
    $('#blk_ctrl_focus')[0].style.display = GetCookie('#blk_click_focus') == 'open' ? 'block' : 'none';
    $('#blk_ctrl_usersw')[0].style.display = GetCookie('#blk_click_usersw') == 'open' ? 'block' : 'none';
    $('#blk_ctrl_disptv')[0].style.display = GetCookie('#blk_click_disptv') == 'open' ? 'block' : 'none';
    //アイコンを復帰
    $('#clk_icon_camera')[0].src = GetCookie('#blk_click_camera') == 'open' ? 'img/icon_list_open.png' : 'img/icon_list_close.png';
    $('#clk_icon_focus')[0].src = GetCookie('#blk_click_focus') == 'open' ? 'img/icon_list_open.png' : 'img/icon_list_close.png';
    $('#clk_icon_usersw')[0].src = GetCookie('#blk_click_usersw') == 'open' ? 'img/icon_list_open.png' : 'img/icon_list_close.png';
    $('#clk_icon_disptv')[0].src = GetCookie('#blk_click_disptv') == 'open' ? 'img/icon_list_open.png' : 'img/icon_list_close.png';
    //ラベルをホワイト表示
    $('#clk_lbl_camera')[0].style.color =
    $('#clk_lbl_focus')[0].style.color =
    $('#clk_lbl_usersw')[0].style.color =
    $('#clk_lbl_disptv')[0].style.color = 'white';
  }
  //フォーカス値表示のオンオフ
  $('#status_icon_focus')[0].style.visibility =
  $('#status_text_focus')[0].style.visibility = b_control_unlock ? 'visible' : 'hidden';

  //出したり消したりも出来る
//  $('.camctrl')[0].style.display = b_control_unlock ? 'block' : 'none';  //カメラコントロール表示/非表示

}

// スライダ変更
function changeSlider()
{
  var slider_val = parseInt($('input#zoom_slider')[0].value);

  DebugMsg(DBGMSG.ZOOM, '@@@@@ changeSlider slider=' + slider_val);

  switch (s_vr_zoom.phase) {
  // 待機中
  case SLIDER.IDOL:
    var diff = Math.abs(slider_val - s_vr_zoom.start.val);
    if ( diff >= 100) {  // 絶対値
      // 元の位置から多く移動した場合、すぐズーム移動命令を送信する
      DebugMsg(DBGMSG.ZOOM, 'SLIDER.IDOL long move slider now SendZoom() slider=' + slider_val + ' before=' + s_vr_zoom.start.val + ' diff=' + diff);
      SendZoom();
    } else {
      // スライダー操作開始、一定時間後にズーム移動命令送信
      s_vr_zoom.phase     = SLIDER.CONTROL;
      s_vr_zoom.start.val = slider_val
      DebugMsg(DBGMSG.ZOOM, 'SLIDER.IDOL short move SendZoom() after 300ms slider=' + slider_val + ' before=' + s_vr_zoom.start.val + ' diff=' + diff + ' > CONTROL');
      s_vr_zoom.start.tm  = setTimeout(SendZoom, 300);
    }
    break;
  // 操作中
  case SLIDER.CONTROL:
    if (Math.abs(slider_val - s_vr_zoom.start.val) >= 100) {  // 絶対値
      // 一定時間内に元の位置からある程度移動した場合、すぐズーム移動命令を送信する
      DebugMsg(DBGMSG.ZOOM, 'SLIDER.CONTROL move SendZoom() after 300ms slider=' + slider_val + ' before=' + s_vr_zoom.start.val);
      SendZoom();
    }
    break;
  // 設定中
  case SLIDER.SETTING:
    DebugMsg(DBGMSG.ZOOM, 'SLIDER.SETTING > IDOL');
    s_vr_zoom.phase = SLIDER.IDOL;  // コマンド通信などで設定した場合はIDOLに戻す
    break;
  case SLIDER.SEND:  // 送信中 途中で本体操作などが入り指定位置まで来れない時タイムアウトする
    clearTimeout(s_vr_zoom.send.tm);  // タイムアウトクリア
    DebugMsg(DBGMSG.ZOOM, 'SLIDER.SEND who is  move TimeoutSendZoom() after 2000ms');
    s_vr_zoom.send.tm = setTimeout(TimeoutSendZoom, 2000);  // タイムアウトタイマーを延長する
    break;  // スライダー操作しない
  default:
    break;
  }
  
  // スライダーのハンドルがはみ出るのを防ぐ
//  DebugMsg(DBGMSG.ZOOM, 'SLIDER Compensation phase '+ s_vr_zoom.phase +' val=' + slider_val +' min=' + SLIDER_SCALE.MIN +' movable=' + SLIDER_SCALE.MOVABLE);
  if (slider_val < SLIDER_SCALE.MIN) {
    $('input#zoom_slider')[0].value = 0;
    $('input#zoom_slider').slider('refresh');
    DebugMsg(DBGMSG.ZOOM, 'SLIDER Compensation movable=' + SLIDER_SCALE.MIN +' under val=' + slider_val +' →' + $('input#zoom_slider')[0].value);
    return;
  }
//  var over_diff = SLIDER_SCALE.MOVABLE - slider_val;
//  if (over_diff < 0) { //ボタンの値が最大のスケールを超えてしまった
  if (SLIDER_SCALE.MOVABLE < slider_val) {  //ダイナミックズームオフ時正常に計算できないときありスライドボタンが最大に移動してしまう
    $('input#zoom_slider')[0].value = SLIDER_SCALE.MOVABLE;
    $('input#zoom_slider').slider('refresh');
    DebugMsg(DBGMSG.ZOOM, 'SLIDER Compensation movable:' + SLIDER_SCALE.MOVABLE +' - val:' + slider_val +' = over deff' + over_diff +' →' + $('input#zoom_slider')[0].value);
    return;
  }
  
  // 影変更
  var shadow = '';
  for (var i = 0; i < g_preset.length; i++) {
    if (g_preset[i].pos == slider_val) {
      shadow = g_preset[i].shadow
      break;
    }
  }
  if (g_sSaveShadow != shadow) {
    g_sSaveShadow = shadow;
    $('.zoom_slider .ui-btn, .ui-btn:focus')[0].style.boxShadow = shadow;
    $('.zoom_slider .ui-btn, .ui-btn:focus')[0].style.WebkitBoxShadow = shadow;
  }
}
// スライダー情報送信開始
// 移動開始後数100ms経過、または元の位置から±100移動した場合に送信
function SendZoom()
{
//  DebugMsg(DBGMSG.ZOOM, 'SLIDER phase SendZoom() '+ s_vr_zoom.phase +'→SEND(2)');
  s_vr_zoom.phase = SLIDER.SEND;
  clearTimeout(s_vr_zoom.start.tm);
  $('.ui-slider-handle')[0].title = '';
  
  s_vr_zoom.send.val = parseInt($('input#zoom_slider')[0].value);
  
  if(s_vr_zoom.send.val < SLIDER_SCALE.MIN){
    DebugMsg(DBGMSG.ZOOM, 'SendZoom() under SendZoom val='+ s_vr_zoom.send.val);
    s_vr_zoom.send.val = SLIDER_SCALE.MIN;
  }else if(s_vr_zoom.send.val > SLIDER_SCALE.MOVABLE){
    DebugMsg(DBGMSG.ZOOM, 'SendZoom() over SendZoom val='+ s_vr_zoom.send.val);
    s_vr_zoom.send.val = SLIDER_SCALE.MOVABLE;
  }else{
    DebugMsg(DBGMSG.ZOOM, 'SendZoom() ok SendZoom val='+ s_vr_zoom.send.val);
  }
  // ズーム位置設定コマンド送信
  SendCommand('SetWebSliderEvent', {Kind:'ZoomBar', 'Position':parseInt(s_vr_zoom.send.val)}, {
    success: function(data) {  // コマンド成功
      if (checkResCommand(data, null) == false){
        return;
      }
      DebugMsg(DBGMSG.ZOOM, 'SendZoom success');
      // タイムアウト設定
      clearTimeout(s_vr_zoom.send.tm);
      s_vr_zoom.send.tm = setTimeout(TimeoutSendZoom, 3000);  //秒以内に完了する
    },
    error: function() {  // 失敗
      DebugMsg(DBGMSG.ZOOM, 'SendZoom error');
    }
  });
}
var ps_zoom_enable = true;
function SendPSZoom(slider_val)
{
  if(ps_zoom_enable == false){
    return; //不感期間にしてステータス取得させる
  }
  ps_zoom_enable = false;
  s_vr_zoom.phase = SLIDER.SEND;
  clearTimeout(s_vr_zoom.start.tm);
  
  // ズーム位置設定コマンド送信
  SendCommand('SetZoomCtrl', {'Position':parseInt(slider_val)}, {  // コマンド成功
    success: function(data) {
      if (checkResCommand(data, null) == false){
        return;
      }
        s_vr_zoom.phase    = SLIDER.IDOL;
        s_vr_zoom.start.val = 0;
    }
  });
  setTimeout(TimeoutSendPsZoom, 1000);
}
function TimeoutSendPsZoom()
{
  ps_zoom_enable = true;  //不感期間終わり
}

// ズーム完了タイムアウト
function TimeoutSendZoom()
{
  DebugMsg(DBGMSG.ZOOM, 'SLIDER phase TimeoutSendZoom() '+ s_vr_zoom.phase +'→IDOL(0)');
  s_vr_zoom.phase    = SLIDER.IDOL;
  s_vr_zoom.start.val = 0;
  s_vr_zoom.send.tm = null;
}

// プリセットボタンの表示設定
function DispPsBtn(b_disp, ps)
{
  var f_enable = true;
  switch(ps.name){
  case 'a':  f_enable= f_zoom_preset1_enable;  break;
  case 'b':  f_enable = f_zoom_preset2_enable;  break;
  case 'c':  f_enable = f_zoom_preset3_enable;  break;
  }
  if (b_disp & f_enable) {
    $('#icon_ps_' + ps.name)[0].src = 'img/btn_icon_ps_'+ ps.name +'.png';
    $('#btn_ps_'  + ps.name)[0].style.color = ps.color;
    if ($('#btn_ps_'  + ps.name).css('backgroundImage').indexOf('btn_ps_back.png') < 0)
      $('#btn_ps_'  + ps.name)[0].style.backgroundImage = 'url(../img/btn_ps_back.png)';
  } else {
    $('#icon_ps_' + ps.name)[0].src = 'img/btn_icon_ps_'+ ps.name +'_dis.png';
    $('#btn_ps_'  + ps.name)[0].style.color = ps.dis_color;
    if ($('#btn_ps_'  + ps.name).css('backgroundImage').indexOf('btn_ps_back_dis.png') < 0)
      $('#btn_ps_'  + ps.name)[0].style.backgroundImage = 'url(../img/btn_ps_back_dis.png)';
  }
  $('#btn_ps_'  + ps.name)[0].style.backgroundSize = gPx.btn.size.ps;
}
//プリセットがあるか？
function isRegistPreset(){
  var b_clear_enable = false;
  for (var i = 0; i < g_preset.length; i++) {
    if (g_preset[i].pos >= 0){
      b_clear_enable = true;
      break;  //一個でも登録されていたらOK
    }
  }
  return b_clear_enable;
}
// 文字/アイコンつきボタンの表示設定
function DispStrBtn(b_disp, name)
{
  if(name == 'clear'){  // クリアボタン表示設定
    if (b_disp) {  // 表示時はプリセットの登録状態をチェックし登録がなければ表示しない
      var b_clear_enable = false;
      b_clear_enable = isRegistPreset();
      if (b_clear_enable == false){
        b_disp = false;
      }
    }
  }

  if (b_disp) {
    $('#btn_'+ name)[0].style.color = 'white';
    if(name == 'preset'){
      var back_png = g_bPresetSetMode ? 'btn_back_sel.png' : 'btn_back.png';
      if ($('#btn_preset').css('backgroundImage').indexOf(back_png) < 0)
        $('#btn_preset')[0].style.backgroundImage = g_bPresetSetMode ? 'url(../img/btn_back_sel.png)' : 'url(../img/btn_back.png)' ;
    }else if(name == 'clear'){
      var back_png = g_bPresetClearMode ? 'btn_back_sel.png' : 'btn_back.png';
      if ($('#btn_clear').css('backgroundImage').indexOf(back_png) < 0)
        $('#btn_clear')[0].style.backgroundImage = g_bPresetClearMode ? 'url(../img/btn_back_sel.png)' : 'url(../img/btn_back.png)' ;
    }else{
      if ($('#btn_'+ name).css('backgroundImage').indexOf('btn_back.png') < 0)
        $('#btn_'+ name)[0].style.backgroundImage = 'url(../img/btn_back.png)';
    }
  } else {
    $('#btn_'+ name)[0].style.color = 'gray';
    if ($('#btn_'+ name).css('backgroundImage').indexOf('btn_back_dis.png') < 0)
      $('#btn_'+ name)[0].style.backgroundImage = 'url(../img/btn_back_dis.png)';
  }
  $('#btn_'+ name)[0].style.backgroundSize = gPx.btn.size.str;
}
// はみ出し対策
function CheckOverflowPlMeta()
{
  // デザイン上はみ出そうな文字は対策を施しておく
  new OverflowString('#btn_preset', {max_width: PxToN('#btn_preset', 'width') * 0.95 });
  new OverflowString('#btn_clear' , {max_width: PxToN('#btn_clear' , 'width') * 0.95 });
  new OverflowString('#btn_wide'  , {max_width: PxToN('#btn_wide'  , 'width') * 0.95 });
  new OverflowString('#btn_tele'  , {max_width: PxToN('#btn_tele'  , 'width') * 0.95 });
  if (g_bMobile) {
    new OverflowString('#lbl_wide');
    new OverflowString('#lbl_zoom');
    new OverflowString('#lbl_tele');
  }
}
