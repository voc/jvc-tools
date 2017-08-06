// Camera Control ////////////

// スタティック変数 //////////
var s_menu = {};
var s_btn  = {};
var s_lbl  = {};
var s_pnl  = { send_val:{x:0, y:0}, tm_cmd : null, tm_wait : null};
var s_sts  = { Enable:{}, Iris:{}, Gain:{}, Shutter:{}, Whb:{}, Focus:{}, Usersw:{} };
var s_cmd  = {};
var s_b_trans = false;
var s_res_data = { Enable:{Whb:{}}, Whb:{}, ButtonLetter:{Gain:{}, User:{}, Whb:{}} }

var alc_btn = { L : false , M : false , H : false };
var faw_btn = { Preset : false , A : false , B : false };

// 関数 /////////
function initOpnClsMenuCC()
{
  b_control_unlock = true;  //ロック状態は無いのでtrueのまま最初に初期化しないとメニューが開かない
  // カメラコントロール開閉メニュー
  s_menu = {
    rec     : new MenuOC('#blk_click_rec'     , '#clk_icon_rec'     , '#blk_ctrl_rec'  ),
    camera  : new MenuOC('#blk_click_camera'  , '#clk_icon_camera'  , '#blk_ctrl_camera'  ),
    ae_level: new MenuOC('#blk_click_ae_level', '#clk_icon_ae_level', '#blk_ctrl_ae_level'),
    iris    : new MenuOC('#blk_click_iris'    , '#clk_icon_iris'    , '#blk_ctrl_iris'    ),
    gain    : new MenuOC('#blk_click_gain'    , '#clk_icon_gain'    , '#blk_ctrl_gain'    ),
    shutter : new MenuOC('#blk_click_shutter' , '#clk_icon_shutter' , '#blk_ctrl_shutter' ),
    whb     : new MenuOC('#blk_click_whb'     , '#clk_icon_whb'     , '#blk_ctrl_whb'     ),
    zoom    : new MenuOC('#blk_click_zoom'    , '#clk_icon_zoom'    , '#blk_ctrl_zoom'    ),
    focus   : new MenuOC('#blk_click_focus'   , '#clk_icon_focus'   , '#blk_ctrl_focus'   ),
    usersw  : new MenuOC('#blk_click_usersw'  , '#clk_icon_usersw'  , '#blk_ctrl_usersw'  ),
    disptv  : new MenuOC('#blk_click_disptv'  , '#clk_icon_disptv'  , '#blk_ctrl_disptv'  ),
    whb_wh_print : new MenuOC('#blk_click_whb_wh_paint', '#clk_icon_whb_wh_paint', '#blk_ctrl_whb_wh_paint')
  };
}
function initOpnClsMenuRC()
{
  b_control_unlock = true;  //ロック時FOCUSステータス非表示にするためのフラグ
  // ビューリモート開閉メニュー
  s_menu = {
    camera  : new MenuOC('#blk_click_camera'  , '#clk_icon_camera'  , '#blk_ctrl_camera'  ),
    ae_level: new MenuOC('#blk_click_ae_level', '#clk_icon_ae_level', '#blk_ctrl_ae_level'),
    iris    : new MenuOC('#blk_click_iris'    , '#clk_icon_iris'    , '#blk_ctrl_iris'    ),
    gain    : new MenuOC('#blk_click_gain'    , '#clk_icon_gain'    , '#blk_ctrl_gain'    ),
    shutter : new MenuOC('#blk_click_shutter' , '#clk_icon_shutter' , '#blk_ctrl_shutter' ),
    whb     : new MenuOC('#blk_click_whb'     , '#clk_icon_whb'     , '#blk_ctrl_whb'     ),
    focus   : new MenuOC('#blk_click_focus'   , '#clk_icon_focus'   , '#blk_ctrl_focus'   ),
    usersw  : new MenuOC('#blk_click_usersw'  , '#clk_icon_usersw'  , '#blk_ctrl_usersw'  ),
    disptv  : new MenuOC('#blk_click_disptv'  , '#clk_icon_disptv'  , '#blk_ctrl_disptv'  ),
    whb_wh_print : new MenuOC('#blk_click_whb_wh_paint', '#clk_icon_whb_wh_paint', '#blk_ctrl_whb_wh_paint')
  };
}

function initButton()
{
  // ボタン
  var imgBtn = {  // ボタン画像
    L : new ImgBtnPath('img/btn_camctrl_l.png', 'img/btn_camctrl_l_press.png', 'img/btn_camctrl_l_dis.png', 'img/btn_camctrl_l_sel.png', 'img/btn_camctrl_l_trans.png'),
    M : new ImgBtnPath('img/btn_camctrl_m.png', 'img/btn_camctrl_m_press.png', 'img/btn_camctrl_m_dis.png', 'img/btn_camctrl_m_sel.png', 'img/btn_camctrl_m_trans.png'),
    S : new ImgBtnPath('img/btn_camctrl_s.png', 'img/btn_camctrl_s_press.png', 'img/btn_camctrl_s_dis.png', 'img/btn_camctrl_s_sel.png', 'img/btn_camctrl_s_trans.png')
  }
  var imgPath = {  // アイコン・パネル画像
    WhbAdjust: new ImgPath('img/icon_whb_adjust.png', 'img/icon_whb_adjust_dis.png'),
    WhPaint  : new ImgPath('img/img_aw_paint.png', 'img/img_aw_paint_dis.png'),
    Infinity : new ImgPath('img/icon_infinity.png', 'img/icon_infinity_dis.png'),
    Up       : new ImgPath('img/icon_arrow_up.png', 'img/icon_arrow_up_dis.png'),
    Left     : new ImgPath('img/icon_arrow_left.png', 'img/icon_arrow_left_dis.png'),
    Right    : new ImgPath('img/icon_arrow_right.png', 'img/icon_arrow_right_dis.png'),
    Down     : new ImgPath('img/icon_arrow_down.png', 'img/icon_arrow_down_dis.png'),
    RecStart : new ImgPath('img/btn_icon_rec.png', 'img/btn_icon_rec_dis.png'),
    RecStop  : new ImgPath('img/btn_icon_stop.png', 'img/btn_icon_stop_dis.png')
  }

  var fnKey = { // フォーカス時のキー操作
    whb_wh_paint: {up:clickWhbWhPaintRP, down:clickWhbWhPaintRM, left:clickWhbWhPaintBM, right:clickWhbWhPaintBP},
    disptv      : {up:clickDisptvUp    , down:clickDisptvDown  , left:clickDisptvLeft  , right:clickDisptvRight , m:clickDisptvMenu, s:clickDisptvSet, c:clickDisptvCancel },
    user        : {n1:clickUserSw1, n2:clickUserSw2, n3:clickUserSw3, n4:clickUserSw4, n5:clickUserSw5, n6:clickUserSw6, n7:clickUserSw7}
  }
  $.extend(fnKey.disptv, fnKey.user);
  
  s_btn = {
    rec_start       : new Button('#btn_rec_start'       , imgBtn.S, {click:clickRecStart     }, { icon:{id:'#icon_rec_start', img:imgPath.RecStart} }),
    rec_stop        : new Button('#btn_rec_stop'        , imgBtn.S, {click:clickRecStop      }, { icon:{id:'#icon_rec_stop', img:imgPath.RecStop} }),
    fullauto_on     : new Button('#btn_fullauto_on'     , imgBtn.S, {click:clickButtonCamctrl}),
    fullauto_off    : new Button('#btn_fullauto_off'    , imgBtn.S, {click:clickButtonCamctrl}),
    fullauto_preset : new Button('#btn_fullauto_preset' , imgBtn.S, {click:clickButtonCamctrl}),
    ae_level_up     : new Button('#btn_ae_level_up'     , imgBtn.S, {hold :clickAELevelUp    }),
    ae_level_down   : new Button('#btn_ae_level_down'   , imgBtn.S, {hold :clickAELevelDown  }),
    ae_level_adjust_on : new Button('#btn_ae_level_adjust_on' , imgBtn.S, {hold :clickAELevelAdjustOn}),
    ae_level_adjust_off : new Button('#btn_ae_level_adjust_off' , imgBtn.S, {hold :clickAELevelAdjustOff}),
    iris_manual     : new Button('#btn_iris_manual'     , imgBtn.M, {click:clickButtonCamctrl}),
    iris_auto       : new Button('#btn_iris_auto'       , imgBtn.M, {click:clickButtonCamctrl}),
    iris_open1      : new Button('#btn_iris_open1'      , imgBtn.S, {hold :clickButtonCamctrl}),
    iris_open2      : new Button('#btn_iris_open2'      , imgBtn.S, {hold :clickButtonCamctrl}),
    iris_open3      : new Button('#btn_iris_open3'      , imgBtn.S, {hold :clickButtonCamctrl}),
    iris_close1     : new Button('#btn_iris_close1'     , imgBtn.S, {hold :clickButtonCamctrl}),
    iris_close2     : new Button('#btn_iris_close2'     , imgBtn.S, {hold :clickButtonCamctrl}),
    iris_close3     : new Button('#btn_iris_close3'     , imgBtn.S, {hold :clickButtonCamctrl}),
    iris_push_auto  : new Button('#btn_iris_push_auto'  , imgBtn.S, {click:clickButtonCamctrl}),
    gain_manual     : new Button('#btn_gain_manual'     , imgBtn.S, {click:clickButtonCamctrl}),
    gain_alc        : new Button('#btn_gain_alc'        , imgBtn.M, {click:clickButtonCamctrl}),
    gain_lolux      : new Button('#btn_gain_lolux'      , imgBtn.S, {click:clickButtonCamctrl}),
    gain_l          : new Button('#btn_gain_l'          , imgBtn.S, {click:clickButtonCamctrl}),
    gain_m          : new Button('#btn_gain_m'          , imgBtn.S, {click:clickButtonCamctrl}),
    gain_h          : new Button('#btn_gain_h'          , imgBtn.S, {click:clickButtonCamctrl}),
    gain_variable   : new Button('#btn_gain_variable'   , imgBtn.S, {click:clickButtonCamctrl}),
    gain_up1        : new Button('#btn_gain_up1'        , imgBtn.S, {click:clickButtonCamctrl}),
    gain_up2        : new Button('#btn_gain_up2'        , imgBtn.S, {click:clickButtonCamctrl}),
    gain_down1      : new Button('#btn_gain_down1'      , imgBtn.S, {click:clickButtonCamctrl}),
    gain_down2      : new Button('#btn_gain_down2'      , imgBtn.S, {click:clickButtonCamctrl}),
    shutter_off     : new Button('#btn_shutter_off'     , imgBtn.S, {click:clickButtonCamctrl}),
    shutter_manual  : new Button('#btn_shutter_manual'  , imgBtn.S, {click:clickButtonCamctrl}),
    shutter_step    : new Button('#btn_shutter_step'    , imgBtn.S, {click:clickButtonCamctrl}),
    shutter_variable: new Button('#btn_shutter_variable', imgBtn.S, {click:clickButtonCamctrl}),
    shutter_eei     : new Button('#btn_shutter_eei'     , imgBtn.S, {click:clickButtonCamctrl}),
    shutter_slower  : new Button('#btn_shutter_slower'  , imgBtn.S, {hold :clickButtonCamctrl}),
    shutter_faster  : new Button('#btn_shutter_faster'  , imgBtn.S, {hold :clickButtonCamctrl}),
    whb_manual      : new Button('#btn_whb_manual'      , imgBtn.M, {click:clickButtonCamctrl}),
    whb_faw         : new Button('#btn_whb_faw'         , imgBtn.M, {click:clickButtonCamctrl}),
    whb_preset      : new Button('#btn_whb_preset'      , imgBtn.S, {click:clickButtonCamctrl}),
    whb_a           : new Button('#btn_whb_a'           , imgBtn.S, {click:clickButtonCamctrl}),
    whb_b           : new Button('#btn_whb_b'           , imgBtn.S, {click:clickButtonCamctrl}),
    whb_adjust      : new Button('#btn_whb_adjust'      , imgBtn.S, {click:clickButtonCamctrl}, { icon:{id:'#icon_whb_adjust', img:imgPath.WhbAdjust} }),
    whb_wh_paint_r_p: new Button('#btn_whb_wh_paint_r_p', imgBtn.S, {hold :clickWhbWhPaintRP }, { key:fnKey.whb_wh_paint, icon:{id:'#icon_whb_wh_paint_r_p', img:imgPath.Up   } }),
    whb_wh_paint_r_m: new Button('#btn_whb_wh_paint_r_m', imgBtn.S, {hold :clickWhbWhPaintRM }, { key:fnKey.whb_wh_paint, icon:{id:'#icon_whb_wh_paint_r_m', img:imgPath.Down } }),
    whb_wh_paint_b_p: new Button('#btn_whb_wh_paint_b_p', imgBtn.S, {hold :clickWhbWhPaintBP }, { key:fnKey.whb_wh_paint, icon:{id:'#icon_whb_wh_paint_b_p', img:imgPath.Right} }),
    whb_wh_paint_b_m: new Button('#btn_whb_wh_paint_b_m', imgBtn.S, {hold :clickWhbWhPaintBM }, { key:fnKey.whb_wh_paint, icon:{id:'#icon_whb_wh_paint_b_m', img:imgPath.Left } }),
    zoom_tele1      : new Button('#btn_zoom_tele1'      , imgBtn.S, {hold :clickButtonCamctrl}),
    zoom_tele2      : new Button('#btn_zoom_tele2'      , imgBtn.S, {hold :clickButtonCamctrl}),
    zoom_tele3      : new Button('#btn_zoom_tele3'      , imgBtn.S, {hold :clickButtonCamctrl}),
    zoom_wide1      : new Button('#btn_zoom_wide1'      , imgBtn.S, {hold :clickButtonCamctrl}),
    zoom_wide2      : new Button('#btn_zoom_wide2'      , imgBtn.S, {hold :clickButtonCamctrl}),
    zoom_wide3      : new Button('#btn_zoom_wide3'      , imgBtn.S, {hold :clickButtonCamctrl}),
    focus_manual    : new Button('#btn_focus_manual'    , imgBtn.M, {click:clickButtonCamctrl}),
    focus_auto      : new Button('#btn_focus_auto'      , imgBtn.M, {click:clickButtonCamctrl}),
    focus_infinity  : new Button('#btn_focus_infinity'  , imgBtn.S, {click:clickButtonCamctrl}, { icon:{id:'#icon_focus_infinity', img:imgPath.Infinity} }),
    focus_far1      : new Button('#btn_focus_far1'      , imgBtn.S, {hold :clickButtonCamctrl}),
    focus_far2      : new Button('#btn_focus_far2'      , imgBtn.S, {hold :clickButtonCamctrl}),
    focus_far3      : new Button('#btn_focus_far3'      , imgBtn.S, {hold :clickButtonCamctrl}),
    focus_near1     : new Button('#btn_focus_near1'     , imgBtn.S, {hold :clickButtonCamctrl}),
    focus_near2     : new Button('#btn_focus_near2'     , imgBtn.S, {hold :clickButtonCamctrl}),
    focus_near3     : new Button('#btn_focus_near3'     , imgBtn.S, {hold :clickButtonCamctrl}),
    focus_push_auto : new Button('#btn_focus_push_auto' , imgBtn.S, {click:clickButtonCamctrl}),
    user_sw1        : new Button('#btn_user_sw1'        , imgBtn.L, {click:clickUserSw1      }, { key:fnKey.user, lbl:{id:'#lbl_user_sw1'} }),
    user_sw2        : new Button('#btn_user_sw2'        , imgBtn.L, {click:clickUserSw2      }, { key:fnKey.user, lbl:{id:'#lbl_user_sw2'} }),
    user_sw3        : new Button('#btn_user_sw3'        , imgBtn.L, {click:clickUserSw3      }, { key:fnKey.user, lbl:{id:'#lbl_user_sw3'} }),
    user_sw4        : new Button('#btn_user_sw4'        , imgBtn.L, {click:clickUserSw4      }, { key:fnKey.user, lbl:{id:'#lbl_user_sw4'} }),
    user_sw5        : new Button('#btn_user_sw5'        , imgBtn.L, {click:clickUserSw5      }, { key:fnKey.user, lbl:{id:'#lbl_user_sw5'} }),
    user_sw6        : new Button('#btn_user_sw6'        , imgBtn.L, {click:clickUserSw6      }, { key:fnKey.user, lbl:{id:'#lbl_user_sw6'} }),
    user_sw7        : new Button('#btn_user_sw7'        , imgBtn.L, {click:clickUserSw7      }, { key:fnKey.user, lbl:{id:'#lbl_user_sw7'} }),
    user_sw8        : new Button('#btn_user_sw8'        , imgBtn.L, {click:clickUserSw8      }, { key:fnKey.user, lbl:{id:'#lbl_user_sw8'} }),
    user_sw9        : new Button('#btn_user_sw9'        , imgBtn.L, {click:clickUserSw9      }, { key:fnKey.user, lbl:{id:'#lbl_user_sw9'} }),
    user_sw10       : new Button('#btn_user_sw10'       , imgBtn.L, {click:clickUserSw10     }, { key:fnKey.user, lbl:{id:'#lbl_user_sw10'} }),
    user_sw11       : new Button('#btn_user_sw11'       , imgBtn.L, {click:clickUserSw11     }, { key:fnKey.user, lbl:{id:'#lbl_user_sw11'} }),
    lenz_ret        : new Button('#btn_lenz_ret'        , imgBtn.L, {click:clickLenzRet      }, { key:fnKey.user, lbl:{id:'#lbl_lenz_ret'} }),
    disptv_on       : new Button('#btn_disptv_on'       , imgBtn.M, {click:clickButtonCamctrl}),
    disptv_off      : new Button('#btn_disptv_off'      , imgBtn.M, {click:clickButtonCamctrl}),
    disptv_sdi      : new Button('#btn_disptv_sdi'     , imgBtn.S, {click:clickButtonCamctrl}),
    disptv_hdmi     : new Button('#btn_disptv_hdmi'    , imgBtn.S, {click:clickButtonCamctrl}),
    disptv_video    : new Button('#btn_disptv_video'   , imgBtn.S, {click:clickButtonCamctrl}),
    disptv_menu     : new Button('#btn_disptv_menu'     , imgBtn.M, {click:clickDisptvMenu   }, { key:fnKey.disptv }),
    disptv_set      : new Button('#btn_disptv_set'      , imgBtn.S, {click:clickDisptvSet    }, { key:fnKey.disptv }),
    disptv_cancel   : new Button('#btn_disptv_cancel'   , imgBtn.M, {click:clickDisptvCancel }, { key:fnKey.disptv }),
    disptv_up       : new Button('#btn_disptv_up'       , imgBtn.S, {hold :clickDisptvUp     }, { key:fnKey.disptv, icon:{id:'#icon_disptv_up'   , img:imgPath.Up   } }),
    disptv_left     : new Button('#btn_disptv_left'     , imgBtn.S, {hold :clickDisptvLeft   }, { key:fnKey.disptv, icon:{id:'#icon_disptv_left' , img:imgPath.Left } }),
    disptv_right    : new Button('#btn_disptv_right'    , imgBtn.S, {hold :clickDisptvRight  }, { key:fnKey.disptv, icon:{id:'#icon_disptv_right', img:imgPath.Right} }),
    disptv_down     : new Button('#btn_disptv_down'     , imgBtn.S, {hold :clickDisptvDown   }, { key:fnKey.disptv, icon:{id:'#icon_disptv_down' , img:imgPath.Down } }),
    disptv_status   : new Button('#btn_disptv_status'   , imgBtn.M, {click:clickButtonCamctrl}),
    disptv_display  : new Button('#btn_disptv_display'  , imgBtn.M, {click:clickButtonCamctrl})
  };
  
  //// 文字はみ出し対応
  var lbl_size = {
    title  : PxToN('div.navi_title', 'width') - PxToN('#navi_camera_name', 'width', 'left') * 2 - 10
  }
  new OverflowString('#navi_page_name', { max_width: lbl_size.title  });
  
  
  // ラベル(Buttonクラスでも設定できるが、複数のボタンに関わるため別に設定する)
  s_lbl = {
    camera_name    : new Label('#navi_camera_name'  ),
    fullauto       : new Label('#lbl_fullauto'      ),
    iris_open      : new Label('#lbl_iris_open'     ),
    iris_close     : new Label('#lbl_iris_close'    ),
    zoom_tele      : new Label('#lbl_zoom_tele'     ),
    whb_wh_paint_r : new Label('#lbl_whb_wh_paint_r'),
    whb_wh_paint_b : new Label('#lbl_whb_wh_paint_b'),
    zoom_wide      : new Label('#lbl_zoom_wide'     ),
    focus_far      : new Label('#lbl_focus_far'     ),
    focus_near     : new Label('#lbl_focus_near'    ),
    disptv_onoff   : new Label('#lbl_disptv_onoff'  ),
    character_mix  : new Label('#lbl_character_mix' )
  }
  
  // パネル
  s_pnl.whb_wh_paint = new Slider('#pnl_whb_wh_paint', '#icon_pnl_whb_wh_paint', movePanelWhPaint, { back_img:imgPath.WhPaint, ptr:{key:fnKey.whb_wh_paint} })
}
// 初期化
function initPageCamCtrl()
{
  GetModel(showPageCamCtrl,sessionCamctrl);  //モデル情報を取得しモデル別の処理を実施
}
//表示
function showPageCamCtrl(res_data)
{
  g_web.page_id = 'camctrl';
  
  initOpnClsMenuCC();  // 開閉メニュー
  
  initButton();  // ボタン
  
  distinctionModelCamCtrl(res_data);  //モデル別の処理を実施
  
  // ステータス取得開始
  GetStatus(getStatusCamctrl, sessionCamctrl);
  
  // デバッグ
//  if (g_get['view']) {
    // ./camera_control.php?view=push(or get)でライブビュー表示
//    $('.camctrl_main')[0].style.top = (PxToN('#block_ee', 'top') + (g_bMobile ? 180:333)) +'px';
//    $('#block_ee')[0].style.display = 'block';
//    LiveView();
//  }
}


var fullauto_preset_flag = false;          //フルオートのプリセットボタン機能
var user10_flag = false;                   //ユーザーボタン１０機能
var dynamic_zoom_effective_flag = false;   //ダイナミックズーム機能
var mft_lens_limit_flag = false;           //MFTレンズ制限対応
var variable_gain_flag = false;            //バリアブルゲイン機能

// カメラ情報取得しモデル別処理を実行
function distinctionModelCamCtrl(res_data)
{
  //機種指定がされたら優先
  if (g_get['model']) {
    if((g_get['model'] == 'LS300')
      || (g_get['model'] == 'LS330')){         //GY-LS300 or GY-HM330
      fullauto_preset_flag = true;         //フルオートプリセットボタン機能オン
      user10_flag = true;                  //ユーザーボタン１０機能オン
      dynamic_zoom_effective_flag = false; //ダイナミックズーム機能オフ
      mft_lens_limit_flag = true;          //MFTレンズ制限対応
      variable_gain_flag = true;           //バリアブルゲイン機能オン
    } else if(g_get['model'] == 'HM200'){  //GY-HM200
      fullauto_preset_flag = false;        //フルオートプリセットボタン機能オフ
      user10_flag = false;                 //ユーザーボタン１０機能オフ
      dynamic_zoom_effective_flag = true;  //ダイナミックズーム機能オン
      mft_lens_limit_flag = false;         //MFTレンズ制限非対応
      variable_gain_flag = false;          //バリアブルゲイン機能オフ
    }
  } else if((res_data.Model == 'LS300')
    || (res_data.Model == 'LS330')){    //GY-LS300 or GY-HM330
    fullauto_preset_flag = true;           //フルオートプリセットボタン機能オン
    user10_flag = true;                    //ユーザーボタン１０機能オン
    dynamic_zoom_effective_flag = false;   //ダイナミックズーム機能オフ
    mft_lens_limit_flag = true;            //MFTレンズ制限対応
    variable_gain_flag = true;            //バリアブルゲイン機能オン
  } else if(res_data.Model == 'HM200'){    //GY-HM200
    fullauto_preset_flag = false;          //フルオートプリセットボタン機能オフ
    user10_flag = false;                   //ユーザーボタン１０機能オフ
    dynamic_zoom_effective_flag = true;    //ダイナミックズーム機能オン
    mft_lens_limit_flag = false;           //MFTレンズ制限非対応
    variable_gain_flag = false;            //バリアブルゲイン機能オフ
  }

  //フルオートプリセットボタン
  if(fullauto_preset_flag == false){
    $('#btn_fullauto_preset')[0].style.visibility = 'hidden';
    $('#btn_fullauto_preset')[0].style.display = 'none';
    $('#back_btn_fullauto')[0].style.left = g_bMobile ? '70px' : '200px';
    $('#back_btn_fullauto')[0].style.width = g_bMobile ? '150px' : '231px';
    $('#lbl_fullauto')[0].innerHTML = 'FULL AUTO';
    s_btn.fullauto_on.SetText($.trim('ON'));
  }else{  //CG16A AUTO MODE AUTO/PRESET/OFF
    $('#btn_fullauto_preset')[0].style.visibility = 'visible';
//    $('#btn_fullauto_preset')[0].style.display = 'block';
    $('#back_btn_fullauto')[0].style.left = g_bMobile ? '35px' : '160px';
    $('#back_btn_fullauto')[0].style.width = g_bMobile ? '228px' : '360px';
    $('#lbl_fullauto')[0].innerHTML = 'AUTO MODE';
    s_btn.fullauto_on.SetText($.trim('FULL'));
  }

  //ユーザーボタン１０
  if(user10_flag == false){
    $('#lbl_user_sw10')[0].style.visibility = 'hidden';
    $('#lbl_user_sw10')[0].style.display = 'none';
    $('#back_btn_user_sw10')[0].style.visibility = 'hidden';
    $('#back_btn_user_sw10')[0].style.display = 'none';
    $('#blk_ctrl_usersw')[0].style.height = g_bMobile ? '450px' : '260px';
  }else{  //CG16A
    $('#lbl_user_sw10')[0].style.visibility = 'visible';
//    $('#lbl_user_sw10')[0].style.display = 'block';
    $('#back_btn_user_sw10')[0].style.visibility = 'visible';
//    $('#back_btn_user_sw10')[0].style.display = 'block';
    $('#blk_ctrl_usersw')[0].style.height = g_bMobile ? '500px' : '260px';
  }

  //バリアブルゲイン機能
  if(variable_gain_flag == false){ //ボタンを隠す
    $('#back_btn_gain_lolux')[0].style.left = g_bMobile ? '108px' : '425px';
    $('#blk_ctrl_gain')[0].style.height = g_bMobile ? '115px' : '65px';
    $('#back_btn_gain_variable')[0].style.visibility = 'hidden';
    $('#back_btn_gain_variable')[0].style.display = 'none';
    $('#lbl_gain_up')[0].style.visibility = 'hidden';
    $('#lbl_gain_up')[0].style.display = 'none';
    $('#back_btn_gain_up')[0].style.visibility = 'hidden';
    $('#back_btn_gain_up')[0].style.display = 'none';
    $('#lbl_gain_down')[0].style.visibility = 'hidden';
    $('#lbl_gain_down')[0].style.display = 'none';
    $('#back_btn_gain_down')[0].style.visibility = 'hidden';
    $('#back_btn_gain_down')[0].style.display = 'none';
  }else{
    $('#back_btn_gain_lolux')[0].style.left = g_bMobile ? '65px' : '425px';
    $('#blk_ctrl_gain')[0].style.height = g_bMobile ? '210px' : '175px';
    $('#back_btn_gain_variable')[0].style.visibility = 'visible';
//    $('#back_btn_gain_variable')[0].style.display = 'block';
    $('#back_btn_gain_up')[0].style.visibility = 'visible';
//    $('#back_btn_gain_up')[0].style.display = 'none';
    $('#back_btn_gain_up')[0].style.visibility = 'visible';
//    $('#back_btn_gain_up')[0].style.display = 'block';
    $('#lbl_gain_down')[0].style.visibility = 'visible';
//    $('#lbl_gain_down')[0].style.display = 'none';
    $('#back_btn_gain_down')[0].style.visibility = 'visible';
//    $('#back_btn_gain_down')[0].style.display = 'block';
  }

}

// ステータス取得(カメラ制御ページ)
function getStatusCamctrl(res_data)
{
  // 取得ステータス解析
  var st = { Rec:{}, AeLevel:{}, Iris:{}, Gain:{}, Shutter:{}, Whb:{}, Zoom:{}, Focus:{}};
  // 表示文字列(空白を削除)
  var btnLetter  = res_data.ButtonLetter;
  var saveLetter = s_res_data.ButtonLetter;
  // 許可/禁止/選択
  var en  = res_data.Enable;

  // ステータス表示更新
  // REC状態
  var rec_allow = 1;  //1:状態によってボタンを制限
  var en_RecStart = 1;
  var en_RecStop = 1;
  var rec_icon, rec_str, rec_color;
  if(g_web.page_id == 'camctrl'){
    switch (res_data.Status) {
      case 'NoCard'  :  rec_icon ='stop';  rec_str ='---';  rec_color ='white';
        if(rec_allow){  en_RecStart = en_RecStop = 0;}
        break;  // カード無し
      case 'Stop'    :  rec_icon ='stop';  rec_str ='STOP'; rec_color ='white';
        if(rec_allow){  en_RecStart = en_RecStop = 0;}
        break;  // 停止(アクティブスロットMedia End)
      case 'Rec'     :  rec_icon ='rec';    rec_str ='REC';  rec_color ='red';
        if(rec_allow){
          if((res_data.RecMode=='Clip')||(res_data.RecMode=='Frame')){  en_RecStart =  1;
          }else{  en_RecStart =  0;
          }
          en_RecStop = 1;
        }
        break;  // 録画
      case 'RecPause':  rec_icon ='stby_y'; rec_str ='STBY'; rec_color ='yellow';
        if(rec_allow){
          if((res_data.RecMode=='Clip')||(res_data.RecMode=='Frame')){  en_RecStop =  1;
          }else{  en_RecStop =  0;
          }
          en_RecStart = 1;
        }
        break;  // 一時停止(Frame Rec)
      case 'Standby' :
      default        :  rec_icon ='stby_w'; rec_str ='STBY'; rec_color ='white';
        if(rec_allow){  en_RecStop = 0;  en_RecStart = 1; }
        break;  // 停止
    }
    // ステータス表示更新
    $('#status_text_rec'     )[0].innerHTML             = rec_str;
    $('#status_text_rec'     )[0].style.color           =  rec_color;

    //RECモードアイコン
    var str_rec_mode;
    switch (res_data.RecMode) {
      case 'Pre'     : str_rec_mode = 'P'; break;
      case 'Clip'    : str_rec_mode = 'C'; break;
      case 'Frame'   : str_rec_mode = 'F'; break;
      case 'Interval': str_rec_mode = 'I'; break;
      case 'Variable': str_rec_mode = 'V'; break;
      case 'Normal'  : 
      default        : str_rec_mode = ''; break;
    }
    // ステータス表示更新
    $('#status_icon_rec_mode')[0].innerHTML             = str_rec_mode;
    $('#status_icon_rec_mode')[0].style.backgroundColor = rec_color;
    // 許可/禁止/選択
    s_btn.rec_start       .SetStatus(en_RecStart      , false );
    s_btn.rec_stop        .SetStatus(en_RecStop       , false );
  }
  
  // AEレベル
  switch (res_data.AeLevel.Status) {
    case 'AeOn'    :
    case 'AeOnFace': st.AeLevel.text = 'AE'+ res_data.AeLevel.Letter; break;
    case 'AeOff'   :
    default        : st.AeLevel.text = ''; break;
  }
  // ステータス表示更新
  $('#status_text_ae_level')[0].innerHTML = st.AeLevel.text;
  // 動作可不可更新
  var ae_level_tag_disp = (en.AeLevel.Status) ? ((en.AeLevel.StatusDisp) ? 'visible' : 'hidden') :  'hidden';
  $('#status_text_ae_level')[0].style.visibility = ae_level_tag_disp;
  // 許可/禁止/選択
  s_btn.ae_level_up     .SetStatus(en.AeLevel.AeLevelUp  , false);
  s_btn.ae_level_down   .SetStatus(en.AeLevel.AeLevelDown, false);
  s_btn.ae_level_adjust_on   .SetStatus(en.AeLevel.AdjustOn, ((en.AeLevel.Status) ? (res_data.AeLevel.Adjust == 'On') : false) );
  s_btn.ae_level_adjust_off   .SetStatus(en.AeLevel.AdjustOff, ((en.AeLevel.Status) ? (res_data.AeLevel.Adjust == 'Off') : false) );
  
  // アイリス
  switch (res_data.Iris.Status) {
    case 'Manual'    : st.Iris = {ma:'Manual', icon:'' }; break;
    case 'Auto'      : st.Iris = {ma:'Auto'  , icon:'A'}; break;
    case 'AutoAELock': st.Iris = {ma:'Auto'  , icon:'L'}; break;
    default          : st.Iris = {ma:''      , icon:'' }; break;
  }
  st.Iris.text = res_data.Iris.Letter.slice(st.Iris.icon.length);  // 元データからアイコン部分の文字を削除
  // ステータス表示更新
  $('#status_icon_iris'    )[0].innerHTML = st.Iris   .icon;
  $('#status_text_iris'    )[0].innerHTML = st.Iris   .text;
  // 動作可不可更新
  var iris_tag_disp = (en.Iris.Status) ? ((en.Iris.StatusDisp) ? 'visible' : 'hidden') :  'hidden';
  $('#status_icon_iris'    )[0].style.visibility = iris_tag_disp;
  $('#status_text_iris'    )[0].style.visibility = iris_tag_disp;
  // 許可/禁止/選択
  s_btn.iris_manual     .SetStatus(en.Iris.Manual   , ((en.Iris.Status) ? (st.Iris.ma     == 'Manual') : false ));
  s_btn.iris_auto       .SetStatus(en.Iris.Auto     , ((en.Iris.Status) ? (st.Iris.ma     == 'Auto'  ) : false ));
  s_btn.iris_open1      .SetStatus(en.Iris.Open1    , false);
  s_btn.iris_open2      .SetStatus(en.Iris.Open2    , false);
  s_btn.iris_open3      .SetStatus(en.Iris.Open3    , false);
  s_btn.iris_close1     .SetStatus(en.Iris.Close1   , false);
  s_btn.iris_close2     .SetStatus(en.Iris.Close2   , false);
  s_btn.iris_close3     .SetStatus(en.Iris.Close3   , false);
  s_btn.iris_push_auto  .SetStatus(en.Iris.PushAuto , false);
  // ラベル色
  s_lbl.iris_open     .SetEnable(en.Iris.Open1  || en.Iris.Open2  || en.Iris.Open3);
  s_lbl.iris_close    .SetEnable(en.Iris.Close1 || en.Iris.Close2 || en.Iris.Close3);
  
  // ゲイン
  switch (res_data.Gain.Status) {
    case 'ManualL'  : st.Gain = {ma:'Manual', lmh:'L', icon:''  }; break;
    case 'ManualM'  : st.Gain = {ma:'Manual', lmh:'M', icon:''  }; break;
    case 'ManualH'  : st.Gain = {ma:'Manual', lmh:'H', icon:''  }; break;
    case 'Alc'      : st.Gain = {ma:'Alc'   , lmh:'' , icon:'A' }; break;
    case 'AlcAELock': st.Gain = {ma:'Alc'   , lmh:'' , icon:'L' }; break;
    case 'Lolux'    : st.Gain = {ma:'Lolux' , lmh:'' , icon:''  }; break;
    case 'Variable' : st.Gain = {ma:'Variable', lmh:'' , icon:''  }; break;
    default         : st.Gain = {ma:''      , lmh:'' , icon:''  }; break;
  }
  st.Gain.text = res_data.Gain.Letter.slice(st.Gain.icon.length);
  // ステータス表示更新
  $('#status_icon_gain'    )[0].innerHTML = st.Gain   .icon;
  $('#status_text_gain'    )[0].innerHTML = st.Gain   .text;
  // 動作可不可更新
  var gain_tag_disp = (en.Gain.Status) ? ((en.Gain.StatusDisp) ? 'visible' : 'hidden') :  'hidden';
  $('#status_icon_gain'    )[0].style.visibility = gain_tag_disp;
  $('#status_text_gain'    )[0].style.visibility = gain_tag_disp;
  // 表示文字列(空白を削除)
  if (btnLetter.Gain.L   != saveLetter.Gain.L  )  s_btn.gain_l  .SetText($.trim(btnLetter.Gain.L  ));
  if (btnLetter.Gain.M   != saveLetter.Gain.M  )  s_btn.gain_m  .SetText($.trim(btnLetter.Gain.M  ));
  if (btnLetter.Gain.H   != saveLetter.Gain.H  )  s_btn.gain_h  .SetText($.trim(btnLetter.Gain.H  ));
  alc_btn.L = ((btnLetter.Gain.L == ' AGC') ? true : false);
  alc_btn.M = ((btnLetter.Gain.M == ' AGC') ? true : false);
  alc_btn.H = ((btnLetter.Gain.H == ' AGC') ? true : false);
  // 許可/禁止/選択
//  s_btn.gain_manual     .SetStatus(en.Gain.Manual   , ((en.Gain.Status) ? (st.Gain.ma     == 'Manual') : false ));
//  s_btn.gain_alc        .SetStatus(en.Gain.Alc      , ((en.Gain.Status) ? (st.Gain.ma     == 'Alc'   ) : false ));
  s_btn.gain_lolux      .SetStatus(en.Gain.Lolux    , ((en.Gain.Status) ? (st.Gain.ma     == 'Lolux' ) : false ));
  s_btn.gain_l          .SetStatus(en.Gain.L        , ((en.Gain.Status) ? (alc_btn.L ? (st.Gain.ma     == 'Alc'   ) : (st.Gain.lmh    == 'L'     )) : false ));
  s_btn.gain_m          .SetStatus(en.Gain.M        , ((en.Gain.Status) ? (alc_btn.M ? (st.Gain.ma     == 'Alc'   ) : (st.Gain.lmh    == 'M'     )) : false ));
  s_btn.gain_h          .SetStatus(en.Gain.H        , ((en.Gain.Status) ? (alc_btn.H ? (st.Gain.ma     == 'Alc'   ) : (st.Gain.lmh    == 'H'     )) : false ));
  s_btn.gain_variable   .SetStatus(en.Gain.Variable , ((en.Gain.Status) ? (st.Gain.ma     == 'Variable' ) : false ));
  s_btn.gain_up1        .SetStatus(en.Gain.Up1, false);
  s_btn.gain_up2        .SetStatus(en.Gain.Up2, false);
  s_btn.gain_down1      .SetStatus(en.Gain.Down1, false);
  s_btn.gain_down2      .SetStatus(en.Gain.Down2, false);

  // シャッター
  switch (res_data.Shutter.Status) {
    case 'Off'      : st.Shutter = {ma:'Off'   , icon:''  }; break;
    case 'Manual'   : st.Shutter = {ma:'Manual', icon:''  }; break;
    case 'Eei'      : st.Shutter = {ma:'Eei'   , icon:'A' }; break;
    case 'EeiAELock': st.Shutter = {ma:'Eei'   , icon:'L' }; break;
    case 'Step'     : st.Shutter = {ma:'Step'  , icon:''  }; break;
    case 'Variable' : st.Shutter = {ma:'Variable', icon:''  }; break;
    default         : st.Shutter = {ma:''      , icon:''  }; break;
  }
  st.Shutter.text = res_data.Shutter.Letter.slice(st.Shutter.icon.length);
  // ステータス表示更新
  $('#status_icon_shutter' )[0].innerHTML = st.Shutter.icon;
  $('#status_text_shutter' )[0].innerHTML = st.Shutter.text;
  // 動作可不可更新
  var shutter_tag_disp = (en.Shutter.Status) ? ((en.Shutter.StatusDisp) ? 'visible' : 'hidden') :  'hidden';
  $('#status_icon_shutter' )[0].style.visibility = shutter_tag_disp;
  $('#status_text_shutter' )[0].style.visibility = shutter_tag_disp;
  // 許可/禁止/選択
//  s_btn.shutter_off     .SetStatus(en.Shutter.Off   , ((en.Shutter.Status) ? (st.Shutter.ma  == 'Off'   ) : false ));
//  s_btn.shutter_manual  .SetStatus(en.Shutter.Manual, ((en.Shutter.Status) ? (st.Shutter.ma  == 'Manual') : false ));
  s_btn.shutter_step    .SetStatus(en.Shutter.Step  , ((en.Shutter.Status) ? (st.Shutter.ma  == 'Step') : false ));
  s_btn.shutter_variable.SetStatus(en.Shutter.Variable, ((en.Shutter.Status) ? (st.Shutter.ma  == 'Variable') : false ));
  s_btn.shutter_eei     .SetStatus(en.Shutter.Eei   , ((en.Shutter.Status) ? (st.Shutter.ma  == 'Eei'   ) : false ));
  s_btn.shutter_faster  .SetStatus(en.Shutter.Faster, false);
  s_btn.shutter_slower  .SetStatus(en.Shutter.Slower, false);
  
  // ホワイトバランス
  switch (res_data.Whb.Status) {
    case 'Preset'   : st.Whb = {ma:'Manual', pab:'Preset', icon:''  }; break;
    case 'A'        : st.Whb = {ma:'Manual', pab:'A'     , icon:''  }; break;
    case 'B'        : st.Whb = {ma:'Manual', pab:'B'     , icon:''  }; break;
    case 'Faw'      : st.Whb = {ma:'Faw'   , pab:''      , icon:'A' }; break;
    case 'FawAELock': st.Whb = {ma:'Faw'   , pab:''      , icon:'L' }; break;
    default         : st.Whb = {ma:''      , pab:''      , icon:''  }; break;
  }
  st.Whb.text = escapeHTML(res_data.Whb.Letter.slice(st.Whb.icon.length));  // 「<」「>」をエスケープ
  // ステータス表示更新
  $('#status_icon_whb'     )[0].innerHTML = st.Whb    .icon;
  $('#status_text_whb'     )[0].innerHTML = st.Whb    .text;
  // 動作可不可更新
  var whb_tag_disp = (en.Whb.Status) ? ((en.Whb.StatusDisp) ? 'visible' : 'hidden') :  'hidden';
  $('#status_icon_whb'     )[0].style.visibility = whb_tag_disp;
  $('#status_text_whb'     )[0].style.visibility = whb_tag_disp;
  $('#status_icon_whb_wh_paint')[0].style.visibility = (en.Whb.Status) ? 'visible' : 'hidden';
  $('#status_text_whb_wh_paint')[0].style.visibility = (en.Whb.Status) ? 'visible' : 'hidden';
  // 表示文字列(空白を削除)
  s_btn.whb_preset  .SetText($.trim(btnLetter.Whb.Preset  ));
  s_btn.whb_a  .SetText($.trim(btnLetter.Whb.A  ));
  s_btn.whb_b  .SetText($.trim(btnLetter.Whb.B  ));
  faw_btn.Preset = ((btnLetter.Whb.Preset == 'FAW') ? true : false);
  faw_btn.A = ((btnLetter.Whb.A == 'FAW') ? true : false);
  faw_btn.B = ((btnLetter.Whb.B == 'FAW') ? true : false);
  // 許可/禁止/選択
  s_btn.whb_manual      .SetStatus(en.Whb.Manual    , ((en.Whb.Status) ? (st.Whb.ma      == 'Manual') : false ));
  s_btn.whb_faw         .SetStatus(en.Whb.Faw       , ((en.Whb.Status) ? (st.Whb.ma      == 'Faw'   ) : false ));
  s_btn.whb_preset      .SetStatus(en.Whb.Preset    , ((en.Whb.Status) ? (faw_btn.Preset ? (st.Whb.ma      == 'Faw'   ) : (st.Whb.pab     == 'Preset')) : false ));
  s_btn.whb_a           .SetStatus(en.Whb.A         , ((en.Whb.Status) ? (faw_btn.A ? (st.Whb.ma      == 'Faw'   ) : (st.Whb.pab     == 'A'     )) : false ));
  s_btn.whb_b           .SetStatus(en.Whb.B         , ((en.Whb.Status) ? (faw_btn.B ? (st.Whb.ma      == 'Faw'   ) : (st.Whb.pab     == 'B'     )) : false ));
  s_btn.whb_adjust      .SetStatus(en.Whb.Adjust    , false);
  s_btn.whb_wh_paint_r_p.SetStatus(en.Whb.WhPaintRP , false);
  s_btn.whb_wh_paint_r_m.SetStatus(en.Whb.WhPaintRM , false);
  s_btn.whb_wh_paint_b_p.SetStatus(en.Whb.WhPaintBP , false);
  s_btn.whb_wh_paint_b_m.SetStatus(en.Whb.WhPaintRM , false);
  // ラベル色
  s_lbl.whb_wh_paint_r.SetEnable(en.Whb.WhPaintRP || en.Whb.WhPaintRM);
  s_lbl.whb_wh_paint_b.SetEnable(en.Whb.WhPaintBP || en.Whb.WhPaintBM);
    // スライダー関連
  if (res_data.Whb.WhPaintRLetter != s_res_data.Whb.WhPaintRLetter
   || res_data.Whb.WhPaintBLetter != s_res_data.Whb.WhPaintBLetter) {
     if (res_data.Whb.WhPaintRLetter.match(/^[\s]*$/) && res_data.Whb.WhPaintBLetter.match(/^[\s]*$/) ) {
       // 空白
      $('#status_text_whb_wh_paint')[0].innerHTML = '';
     } else {
       // 取得値を連結
      $('#status_text_whb_wh_paint')[0].innerHTML = 'R:'+ res_data.Whb.WhPaintRLetter +' B:'+ res_data.Whb.WhPaintBLetter;
    }
  }
  // スライダー全体数値
  if (res_data.Whb.WhPaintRScale != s_res_data.Whb.WhPaintRScale
   || res_data.Whb.WhPaintBScale != s_res_data.Whb.WhPaintBScale) {
    var max = {y: res_data.Whb.WhPaintRScale, x:res_data.Whb.WhPaintBScale}
    s_pnl.whb_wh_paint.Max(max);
  }
  // スライダー位置
  if (s_pnl.tm_wait == null) {
    if (res_data.Whb.WhPaintRPosition != s_res_data.Whb.WhPaintRPosition
     || res_data.Whb.WhPaintBPosition != s_res_data.Whb.WhPaintBPosition) {
      var val = {y: res_data.Whb.WhPaintRPosition, x:res_data.Whb.WhPaintBPosition}
      s_pnl.whb_wh_paint.Value(val);
    }
  } else {
    // 送信値と同じ値をステータスから取得するまでポインタを移動させない。
    if (res_data.Whb.WhPaintRPosition != s_pnl.send_val.y
     || res_data.Whb.WhPaintBPosition != s_pnl.send_val.x)
      DebugMsg(DBGMSG.WP, 's_pnl.tm_wait sameval '+ s_pnl.tm_wait +'→null')
      clearTimeout(s_pnl.tm_wait);
      s_pnl.tm_wait = null;
  }
  if (en.Whb.WhPaintRP != s_res_data.Enable.Whb.WhPaintRP
   || en.Whb.WhPaintRM != s_res_data.Enable.Whb.WhPaintRM
   || en.Whb.WhPaintBP != s_res_data.Enable.Whb.WhPaintBP
   || en.Whb.WhPaintBM != s_res_data.Enable.Whb.WhPaintBM){
    s_pnl.whb_wh_paint.SetEnable(en.Whb.WhPaintRP || en.Whb.WhPaintRM || en.Whb.WhPaintBP || en.Whb.WhPaintBM);
  }
  // ズーム
  if(g_web.page_id == 'camctrl'){
//    st.Zoom.text = ('00'+ parseInt(res_data.ZoomDisplayValue)).slice(-3);  // 先頭に0を付加する
    st.Zoom.text = res_data.ZoomDisplayValue;  // 先頭に0を付加する
    // ステータス表示更新
    $('#status_text_zoom'    )[0].innerHTML = st.Zoom   .text;
    // 動作可不可更新
    var zoom_tag_disp = (en.Zoom.Status) ? ((en.Zoom.StatusDisp) ? 'visible' : 'hidden') :  'hidden';
    $('#status_text_zoom'    )[0].style.visibility = zoom_tag_disp;
    // 許可/禁止/選択
    s_btn.zoom_tele1      .SetStatus(en.Zoom.Tele1    , false);
    s_btn.zoom_tele2      .SetStatus(en.Zoom.Tele2    , false);
    s_btn.zoom_tele3      .SetStatus(en.Zoom.Tele3    , false);
    s_btn.zoom_wide1      .SetStatus(en.Zoom.Wide1    , false);
    s_btn.zoom_wide2      .SetStatus(en.Zoom.Wide2    , false);
    s_btn.zoom_wide3      .SetStatus(en.Zoom.Wide3    , false);
    // ラベル色
    s_lbl.zoom_tele     .SetEnable(en.Zoom.Tele1  || en.Zoom.Tele2  || en.Zoom.Tele3);
    s_lbl.zoom_wide     .SetEnable(en.Zoom.Wide1  || en.Zoom.Wide2  || en.Zoom.Wide3);
  }
  
  // フォーカス
  switch (res_data.Focus.Status) {
    case 'AFFace'    :
    case 'AF'        : st.Focus = {ma:'Auto'  , icon:'AF' }; break;
    case 'MFOnePush' :
    case 'MF'        :
    case 'MFFace'    : st.Focus = {ma:'Manual', icon:'MF' }; break;
    default          : st.Focus = {ma:''      , icon:''   }; break;
  }
  st.Focus.text = res_data.Focus.Letter.slice(st.Focus.icon.length);
  if(b_control_unlock){  //ロックされていない
    // ステータス表示更新
    $('#status_icon_focus'   )[0].innerHTML = st.Focus  .icon;
    $('#status_text_focus'   )[0].innerHTML = st.Focus  .text;
    // 動作可不可更新
    var focus_tag_disp = (en.Focus.Status) ? ((en.Focus.StatusDisp) ? 'visible' : 'hidden') :  'hidden';
    $('#status_icon_focus'   )[0].style.visibility = focus_tag_disp;
    $('#status_text_focus'   )[0].style.visibility = focus_tag_disp;
  }
  // 許可/禁止/選択
  s_btn.focus_manual    .SetStatus(en.Focus.Manual  , ((en.Focus.Status) ? (st.Focus.ma    == 'Manual') : false ));
  s_btn.focus_auto      .SetStatus(en.Focus.Auto    , ((en.Focus.Status) ? (st.Focus.ma    == 'Auto'  ) : false ));
  s_btn.focus_far1      .SetStatus(en.Focus.Far1    , false);
  s_btn.focus_far2      .SetStatus(en.Focus.Far2    , false);
  s_btn.focus_far3      .SetStatus(en.Focus.Far3    , false);
  s_btn.focus_infinity  .SetStatus(en.Focus.Infinity, false);
  s_btn.focus_near1     .SetStatus(en.Focus.Near1   , false);
  s_btn.focus_near2     .SetStatus(en.Focus.Near2   , false);
  s_btn.focus_near3     .SetStatus(en.Focus.Near3   , false);
  s_btn.focus_push_auto .SetStatus(en.Focus.PushAuto, false);
  // ラベル色
  s_lbl.focus_far     .SetEnable(en.Focus.Far1  || en.Focus.Far2  || en.Focus.Far3);
  s_lbl.focus_near    .SetEnable(en.Focus.Near1 || en.Focus.Near2 || en.Focus.Near3);

  // ユーザー
  // 表示文字列(空白を削除)
  if (btnLetter.User.Sw1 != saveLetter.User.Sw1) s_btn.user_sw1.SetText($.trim(btnLetter.User.Sw1));
  if (btnLetter.User.Sw2 != saveLetter.User.Sw2) s_btn.user_sw2.SetText($.trim(btnLetter.User.Sw2));
  if (btnLetter.User.Sw3 != saveLetter.User.Sw3) s_btn.user_sw3.SetText($.trim(btnLetter.User.Sw3));
  if (btnLetter.User.Sw4 != saveLetter.User.Sw4) s_btn.user_sw4.SetText($.trim(btnLetter.User.Sw4));
  if (btnLetter.User.Sw5 != saveLetter.User.Sw5) s_btn.user_sw5.SetText($.trim(btnLetter.User.Sw5));
  if (btnLetter.User.Sw6 != saveLetter.User.Sw6) s_btn.user_sw6.SetText($.trim(btnLetter.User.Sw6));
  if (btnLetter.User.Sw7 != saveLetter.User.Sw7) s_btn.user_sw7.SetText($.trim(btnLetter.User.Sw7));
  if (btnLetter.User.Sw8 != saveLetter.User.Sw8) s_btn.user_sw8.SetText($.trim(btnLetter.User.Sw8));
  if (btnLetter.User.Sw9 != saveLetter.User.Sw9) s_btn.user_sw9.SetText($.trim(btnLetter.User.Sw9));
  if (btnLetter.User.Sw10 != saveLetter.User.Sw10) s_btn.user_sw10.SetText($.trim(btnLetter.User.Sw10));
//  if (btnLetter.User.Sw11 != saveLetter.User.Sw11) s_btn.user_sw11.SetText($.trim(btnLetter.User.Sw11));
//  if (btnLetter.User.LenzRet != saveLetter.User.LenzRet) s_btn.lenz_ret.SetText($.trim(btnLetter.User.LenzRet));
  // 許可/禁止/選択
  s_btn.user_sw1        .SetStatus(en.User.Sw1      , false);
  s_btn.user_sw2        .SetStatus(en.User.Sw2      , false);
  s_btn.user_sw3        .SetStatus(en.User.Sw3      , false);
  s_btn.user_sw4        .SetStatus(en.User.Sw4      , false);
  s_btn.user_sw5        .SetStatus(en.User.Sw5      , false);
  s_btn.user_sw6        .SetStatus(en.User.Sw6      , false);
  s_btn.user_sw7        .SetStatus(en.User.Sw7      , false);
  s_btn.user_sw8        .SetStatus(en.User.Sw8      , false);
  s_btn.user_sw9        .SetStatus(en.User.Sw9      , false);
  s_btn.user_sw10       .SetStatus(en.User.Sw10    , false);
//  s_btn.user_sw11       .SetStatus(en.User.Sw11    , false);
//  s_btn.lenz_ret        .SetStatus(en.User.LenzRet  , false);
  
  // フルオート
  // 許可/禁止/選択
  s_btn.fullauto_on     .SetStatus(en.Fullauto.On   , ((en.Fullauto.Status) ? (res_data.Fullauto == 'On') : false ));
  s_btn.fullauto_off    .SetStatus(en.Fullauto.Off  , ((en.Fullauto.Status) ? (res_data.Fullauto == 'Off') : false ));
  s_btn.fullauto_preset .SetStatus(en.Fullauto.Preset  , ((en.Fullauto.Status) ? (res_data.Fullauto == 'Preset') : false ));
  // ラベル色
  s_lbl.fullauto      .SetEnable(en.Fullauto.On   || en.Fullauto.Off || en.Fullauto.Preset );

  // メニュー
  // 許可/禁止/選択
  s_btn.disptv_on       .SetStatus(en.Disptv.On     , (res_data.Disptv   == 'On' ));
  s_btn.disptv_off      .SetStatus(en.Disptv.Off    , (res_data.Disptv   == 'Off' ));
//  s_btn.disptv_sdi      .SetStatus(en.Disptv.Sdi    , (res_data.CharMix.Sdi   == 'On'));
//  s_btn.disptv_hdmi     .SetStatus(en.Disptv.Hdmi   , (res_data.CharMix.Hdmi   == 'On'));
//  s_btn.disptv_video    .SetStatus(en.Disptv.Video  , (res_data.CharMix.Video   == 'On'));
  s_btn.disptv_display  .SetStatus(en.Disptv.Display, false);
  s_btn.disptv_status   .SetStatus(en.Disptv.Status , false);
  s_btn.disptv_menu     .SetStatus(en.Disptv.Menu   , false);
  s_btn.disptv_set      .SetStatus(en.Disptv.Set    , false);
  s_btn.disptv_cancel   .SetStatus(en.Disptv.Cancel , false);
  s_btn.disptv_up       .SetStatus(en.Disptv.Up     , false);
  s_btn.disptv_left     .SetStatus(en.Disptv.Left   , false);
  s_btn.disptv_right    .SetStatus(en.Disptv.Right  , false);
  s_btn.disptv_down     .SetStatus(en.Disptv.Down   , false);
  // ラベル色
  s_lbl.disptv_onoff  .SetEnable(en.Disptv.On   || en.Disptv.Off);

  s_res_data = res_data;
}
// セッション更新(カメラ制御ページ)
function sessionCamctrl(data)
{
  // カメラ名をタイトル左端に表示
  if (data.CamName && data.CamName != s_lbl.camera_name.GetText())
    s_lbl.camera_name.SetText(data.CamName);  // カメラ名表示
//    $('#navi_camera_name')[0].innerHTML = data.CamName;
}

// コマンドパラメータ取得。_を削除して単語の先頭を大文字にする。
// 最初の単語はKind、残りの単語を連結しはKeyで配列にして返す
function get_param (name)
{
  var words = name.split('_');
  var kind  = '', key = '';
  for (var i = 0; i < words.length; i++) {
    var str = words[i].slice(0, 1).toUpperCase()
    if (words[i].length >= 2)
      str += words[i].slice(1);
    if (i == 0)
      kind = str;
    else
      key += str;
  }
  return [kind, key];
}

// キー押下イベント
function clickButtonCamctrl()
{
  if (s_b_trans == true)
    return;  // 送信中は処理しない
  
  var name  = this.id.slice(5);  // IDから"#btn_"を抜く。
  var param = get_param(name);
  
  s_cmd = {
    btn   : s_btn[name],
    param : { Kind : param[0], Key : param[1] }
  }
  SendSetWebKeyEvent();  // SetWebKeyEventコマンド送信
}

function clickRecStart()    { clickKey(s_btn.rec_start       , 'Rec'    , 'Start'  ) }  // REC開始
function clickRecStop()     { clickKey(s_btn.rec_stop        , 'Rec'    , 'Stop'  ) }  // REC停止
function clickAELevelUp()   { clickKey(s_btn.ae_level_up     , 'AeLevel', 'AeLevelUp'  ) }  // AEレベルUp
function clickAELevelDown() { clickKey(s_btn.ae_level_down   , 'AeLevel', 'AeLevelDown') }  // AEレベルDown
function clickAELevelAdjustOn() { clickKey(s_btn.ae_level_adjust_on   , 'AeLevel', 'AdjustOn') }  // AEレベル操作ロック
function clickAELevelAdjustOff() { clickKey(s_btn.ae_level_adjust_off   , 'AeLevel', 'AdjustOff') }  // AEレベル操作ロック
function clickWhbWhPaintRP(){ clickKey(s_btn.whb_wh_paint_r_p, 'Whb'    , 'WhPaintRP'  ) }  // ↑
function clickWhbWhPaintRM(){ clickKey(s_btn.whb_wh_paint_r_m, 'Whb'    , 'WhPaintRM'  ) }  // ↓
function clickWhbWhPaintBP(){ clickKey(s_btn.whb_wh_paint_b_p, 'Whb'    , 'WhPaintBP'  ) }  // ←
function clickWhbWhPaintBM(){ clickKey(s_btn.whb_wh_paint_b_m, 'Whb'    , 'WhPaintBM'  ) }  // →
function clickUserSw1()     { clickKey(s_btn.user_sw1        , 'User'   , 'Sw1'        ) }  // ユーザスイッチ1
function clickUserSw2()     { clickKey(s_btn.user_sw2        , 'User'   , 'Sw2'        ) }  // ユーザスイッチ2
function clickUserSw3()     { clickKey(s_btn.user_sw3        , 'User'   , 'Sw3'        ) }  // ユーザスイッチ3
function clickUserSw4()     { clickKey(s_btn.user_sw4        , 'User'   , 'Sw4'        ) }  // ユーザスイッチ4
function clickUserSw5()     { clickKey(s_btn.user_sw5        , 'User'   , 'Sw5'        ) }  // ユーザスイッチ5
function clickUserSw6()     { clickKey(s_btn.user_sw6        , 'User'   , 'Sw6'        ) }  // ユーザスイッチ6
function clickUserSw7()     { clickKey(s_btn.user_sw7        , 'User'   , 'Sw7'        ) }  // ユーザスイッチ7
function clickUserSw8()     { clickKey(s_btn.user_sw8        , 'User'   , 'Sw8'        ) }  // ユーザスイッチ8
function clickUserSw9()     { clickKey(s_btn.user_sw9        , 'User'   , 'Sw9'        ) }  // ユーザスイッチ9
function clickUserSw10()    { clickKey(s_btn.user_sw10       , 'User'   , 'Sw10'       ) }  // ユーザスイッチ10
function clickUserSw11()    { clickKey(s_btn.user_sw11       , 'User'   , 'Sw11'       ) }  // ユーザスイッチ11
function clickLenzRet()     { clickKey(s_btn.lenz_ret        , 'User'   , 'LenzRet'    ) }  // ユーザスイッチLenzRet
function clickDisptvMenu()  { clickKey(s_btn.disptv_menu     , 'Disptv' , 'Menu'       ) }  // Menu
function clickDisptvSet()   { clickKey(s_btn.disptv_set      , 'Disptv' , 'Set'        ) }  // Set
function clickDisptvCancel(){ clickKey(s_btn.disptv_cancel   , 'Disptv' , 'Cancel'     ) }  // Cancel
function clickDisptvUp()    { clickKey(s_btn.disptv_up       , 'Disptv' , 'Up'         ) }  // ↑
function clickDisptvLeft()  { clickKey(s_btn.disptv_left     , 'Disptv' , 'Left'       ) }  // ←
function clickDisptvRight() { clickKey(s_btn.disptv_right    , 'Disptv' , 'Right'      ) }  // →
function clickDisptvDown()  { clickKey(s_btn.disptv_down     , 'Disptv' , 'Down'       ) }  // ↓
function clickKey(btn, kind, key)
{
  if (s_b_trans == true)
    return;  // 送信中は処理しない

  s_cmd = {
    btn   : btn,
    param : { Kind : kind, Key : key }
  }
  SendSetWebKeyEvent();  // SetWebKeyEventコマンド送信
}

// コマンド送信
function SendSetWebKeyEvent()
{
  DebugMsg(DBGMSG.SEND, JSON.stringify(s_cmd.param));
  set_trans(true);  // 送信中フラグを立てる
  SendCommand('SetWebKeyEvent', s_cmd.param, {
    // 成功
    success: function(data) {
      DebugMsg(DBGMSG.SEND, 'SendSetWebKeyEvent Success');
      set_trans(false);  // 送信中フラグを落とす
      if (checkResCommand(data, {func:SendSetWebKeyEvent, time:100}) == false)  // コマンド応答チェック
        return;
    },
    // 失敗
    error: function() {
      DebugMsg(DBGMSG.SEND, 'SetWebKeyEvent Error');
      set_trans(false);  // 送信中フラグを落とす
    }
  });
  // 送信中フラグを変更する
  function set_trans(b_trans) {
    s_b_trans = b_trans;  // 送信中フラグを立てる
    s_cmd.btn.Trans(b_trans);
  }
}

// パネル移動関数
function movePanelWhPaint()
{
  DebugMsg(DBGMSG.CC, 'movePanelCamctrl');
  if (s_b_trans == true)
    return;  // 送信中は処理しない
  
  // SetWebSliderEventコマンド送信
  send_command();
  
  function send_command()
  {
    s_pnl.send_val = s_pnl.whb_wh_paint.Value();
    // ステータス取得による位置変更禁止タイマー)
    clearTimeout(s_pnl.tm_wait);
    s_pnl.tm_wait = setTimeout(function() {
      DebugMsg(DBGMSG.WP, 's_pnl.tm_wait timeout '+ s_pnl.tm_wait +'→null')
      s_pnl.tm_wait = null;
    }, 5000);
    
    set_trans(true);
    
    var name  = 'SetWebXYFieldEvent';
    var param = { Kind : 'WhPaintRB', XPosition: s_pnl.send_val.x, YPosition: s_pnl.send_val.y};
    SendCommand(name, param, {
      // コマンド成功
      success: function(data) {
        if (checkResCommand(data, {func:send_command, time:100}) == false)  // コマンド応答チェック
          return;
        
        var now_val = s_pnl.whb_wh_paint.Value()
        DebugMsg(DBGMSG.WP, 's_pnl.send_val x='+ s_pnl.send_val.x +' y='+ s_pnl.send_val.y +' now_val x='+ now_val.x +' y='+ now_val.y)
        if (s_pnl.send_val.x != now_val.x || s_pnl.send_val.y != now_val.y) {
          DebugMsg(DBGMSG.WP, 'change')
          s_pnl.tm_cmd = setTimeout(send_command, 100);  // コマンド応答後に位置が変わっている場合は再送信
        } else {
          DebugMsg(DBGMSG.WP, 'no change')
          set_trans(false);
        }
      },
      // コマンド失敗
      error : function() {
        set_trans(false);
      }
    });
    // 送信中フラグを変更する
    function set_trans(b_trans) {
      s_b_trans = b_trans;
      s_pnl.whb_wh_paint.Trans(b_trans);
    }
  }
}

// 開閉メニュークラス (utility.jsのMenu 継承) /////////
// id       開閉メニュークリック
// icon_id  三角アイコン
// block_id 開閉ブロック
var MenuOC = function (id, icon_id, block_id) {
  MenuOC.base.apply(this, [id]);  // 親クラスのコンストラクタ
  
  this.icon = {  // メニューアイコン
    id  : icon_id,
    img : { open : 'img/icon_list_open.png',
            close: 'img/icon_list_close.png' }
  };
  this.block_id = block_id;  // ブロックID
  this.b_open = false;
  
  // 保存クッキーにより初期開閉状態を決める
  this.blockOpenClose(GetCookie(id) == 'open' ? true : false );
}.inheritance(Menu);
// 開閉メニューメソッド
$.extend(MenuOC.prototype, {
  // ローカルメソッド
  // ブロック開閉
  blockOpenClose : function (b_open) {
   if(b_control_unlock){  //ロックされていない
    this.b_open = b_open ? true : false;
    $(this.icon.id)[0].src = b_open ? this.icon.img.open : this.icon.img.close;  // 開/閉アイコン表示
    $(this.block_id)[0].style.display = b_open ? 'block' : 'none';  // ブロック表示/消去
    if(b_open){
      document.cookie = this.id + '=open; expires=Tue, 1-Jan-2030 00:00:00 GMT';  // クッキー保存
    }else{
      document.cookie = this.id + '=open; expires=Fri, 31-Dec-1999 23:59:59 GMT;'  // クッキー消去
    }
   }
  },
  // 継承メソッド
  // クリック処理
  click : function() {
    if (MenuOC.parent.click.apply(this) == false){  // 親クラス実行
      return;
    }
    this.blockOpenClose(this.b_open == true ? false : true);
   }
});
