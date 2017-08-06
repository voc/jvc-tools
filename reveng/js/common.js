var g_get = {};               // Getパラメータ
var g_UserAgent     = '';     // ユーザエージェント
// 固定値
var PAGE = {NONE:0, TOP:1, PLANNING_META:2, CLIP_META:3, VIEW_REMOTE:4, SETTINGS:5, CAMERA_CONTROL:6};
var ALLOWED_PAGE = {
  ALLOWED              :0,  // 表示可
  PENDING              :1,  // 回答保留（ユーザーの回答待ち、状態遷移中など）
  NOT_IN_CAMERA_MODE   :2,  // 本体がカメラモードではない
  NOT_IN_THUMBNAIL_MODE:3,  // 本体がサムネイルモードではない
  USER_CANCEL          :4,  // ユーザーによりキャンセルされた
  ON_RECORDING         :5,  // REC中
  MENU_OPENED          :6,  // メニュー表示中
  USER_UPDATING        :7,  // ユーザーアップデート中
  STREAMING            :8,  // ストリーミング中
  FTP_TRANSPORT        :9,  // FTP転送中
  SDI_INPUT            :10,  // SDI入力中
  HD_WEB_CODEC         :11 // 記録映像解像度HD+Web中
};

//WEB FTP
var FTP_OPERATE = {  //FTP応答コマンドパラメータ
  WEBFTP_RES_STOP              :'0',  //FTP転送中止
  WEBFTP_RES_OVERWRITE        :'1',  //上書き
  WEBFTP_RES_SKIP              :'2',  //スキップ
  WEBFTP_RES_ATTESTATION      :'3',  //認証
  WEBFTP_RES_NO_ATTESTATION    :'4',  //非認証
  WEBFTP_RES_CANCEL            :'5',  //キャンセル
  WEBFTP_RES_OVERWRITE_ALL    :'6',  //全て上書き
  WEBFTP_RES_SKIP_ALL          :'7',  //全てスキップ
  WEBFTP_RES_ERROR_CLEAR      :'8',  //エラー解除
  WEBFTP_RES_RESUME           :'9' //レジューム
};

var FTP_WEB_PHASE = {  //FTP WEBフェーズ
  IDOL            :0,    //アイドル
  UPLOADING        :1,    //アップロード中
  CANCEL          :2,    //アップロード中止中
  ERROR_FINAL      :3,    //エラー終了処理
  CANCEL_FINAL    :4,    //中止終了処理
  NORMAL_FINAL    :5,    //正常終了処理
  ERROR_COMPLETE  :6,    //エラー完了
  CANCEL_COMPLETE  :7,    //中止完了
  NORMAL_COMPLETE  :8    //正常完了
};

var ftp_web_phase = FTP_WEB_PHASE.IDOL;  //@@@@@

// 共通変数
var g_bUpdateLifeTime  = false;

var g_web = { allowed_page : {},  // GetCamStatusのAllowedPageの応答値
              page_id      : '',  // 表示ページID
              pending_page : '',  // 遷移保留中ページID
              changing_page: '',  // 遷移中ページID
              msg_id       : '',  // 表示中メッセージID
              page:{              // ページ情報
                index   :{no: 1, path: '/index.php'},
                pl_meta :{no: 2, path: '/planning_meta.php'  , allowed:'PlanningMetadata' },
                ed_meta :{no: 3, path: '/edit_meta.php'      , allowed:'EditMetadata'     },
                remocon :{no: 4, path: '/remote_control.php' , allowed:'ViewRemote'       },
                setting :{no: 5, path: '/setting.php'        , allowed:'Setting', 
                  web   :{path: '/setting_web.php'   },
                  setup :{path: '/setting_setup.php' },
                  ftp   :{path: '/setting_ftp.php'   },
                  stream:{path: '/setting_streaming.php'}
                },
                camctrl:{no: 6, path: '/camera_control.php', allowed:'CameraControl'},
                scoreinput:{path: '/overlayinput.php'   }
              },
              status_pause:false,        // ステータス取得一時停止フラグ
              live_view: false,          // ライブビュー実行フラグ
              edit_mode_ok: false,       // エディトモード移行フラグ
              retry:{count:0, max:3},    // コマンド送信リトライ回数
              url_opt:''   // URLに常にオプションを付加する場合url_opt=1をULRの最後に追加
            };
var g_meta = {};  // メタデータ情報
// Ajax通信管理情報(同時に通信させないための対応)
var g_ajax = {enable  : true,  // 通信許可フラグ
              cmd_name: '',    // 送信コマンド名
              opt     : {},    // 送信コマンドのAjaxオプション
              cb      : {success : null, error:null, compleate: null},    // 送信コマンドのコールバック関数
              time    : {count:0, max:300000},    // Ajax通信リトライ時間(msec) {count:リトライ合計、out:タイムアウト時間}
              queue   : [],    // コマンドキュー(options. callback)
              max     : 3}     // コマンドキュー最大保持数
var g_contents;     // ページ内の表示コンテンツ(警告表示からの復帰に必要)

var g_view = {mode : '',                // 動画取得方式
              retry:{count:0, max:20}};   // プッシュ時のリトライ回数

// 初期化
$(function()
{
  $(document)
  // ページ共通イベント
  .on('pageinit', function(){
      $.mobile.ajaxLinksEnabled = false;
  })
  .on('vmousedown mouseout vmouseup', '#nv_pl_meta, #nv_pl_meta_act', clickNaviPlMeta)   // ナビゲータ メタデータ設定クリック
  .on('vmousedown mouseout vmouseup', '#nv_remocon, #nv_remocon_act', clickNaviRemocon)  // ナビゲータ リモートビュークリック
  .on('vmousedown mouseout vmouseup', '#nv_ed_meta, #nv_ed_meta_act', clickNaviEdMeta)   // ナビゲータ メタデータ編集クリック
  .on('vmousedown mouseout vmouseup', '#nv_setting, #nv_setting_act', clickNaviSetting)  // ナビゲータ 設定クリック
  .on('vmousedown mouseout vmouseup', '#nv_camctrl, #nv_camctrl_act', clickNaviRemoCam)  // ナビゲータ カメラ制御クリック

//  .on('click', '#msg_btn_RequestEdMetaMode, #msg_btn_RequestCameraMode, #msg_btn_DisableEdMetaForRecording' ,  clickChangeCancel)  // メッセージ ページ移行警告クローズ
//  .on('click', '#msg_btn_RequestCameraMode, #msg_btn_DisableEdMetaForRecording' ,  clickChangeCancel)  // メッセージ ページ移行警告クローズ
  .on('click', '#msg_btn_RequestCameraMode, #msg_btn_DisableOperateForRecording' ,  clickChangeCancel)  // メッセージ ページ移行警告クローズ
  .on('click', '#msg_btn_RequestEdMetaMode1' ,  clickChangeCancel)  // メッセージ ページ移行警告クローズ
  .on('click', '#msg_btn_RequestEdMetaMode2' ,  clickChangeEditModeKey)  // 修正モード移行キー発行

  .on('vmousedown', keyDown)    // マウスダウン、タップイベント
  .on('keydown'   , keyDown);   // キーボード入力イベント

  // ページ別の初期化イベント登録
  var page = location.pathname;
  var init = {};
  if (page.indexOf('/planning_meta'    ) >= 0) init = {id : '#pl_meta'          , func : showPagePlMeta          };
  else if (page.indexOf('/remote_control'   ) >= 0) init = {id : '#remocon'          , func : showPageRemocon         };
  else if (page.indexOf('/edit_meta'        ) >= 0) init = {id : '#ed_meta'          , func : showPageEdMeta          };
  else if (page.indexOf('/setting_web'      ) >= 0) init = {id : '#setting_web'      , func : showPageSettingWeb      };
  else if (page.indexOf('/setting_setup'    ) >= 0) init = {id : '#setting_setup'    , func : showPageSettingSetup    };
  else if (page.indexOf('/setting_ftp'      ) >= 0) init = {id : '#setting_ftp'      , func : showPageSettingFtp      };
  else if (page.indexOf('/setting_streaming') >= 0) init = {id : '#setting_streaming', func : showPageSettingStreaming};
  else if (page.indexOf('/setting'          ) >= 0) init = {id : '#setting'          , func : showPageSetting         };
  else if (page.indexOf('/camera_control'   ) >= 0) init = {id : '#camctrl'          , func : initPageCamCtrl         };
  else if (page.indexOf('/overlayinput'       ) >= 0) init = {id : '#scoreinput'       , func : initPageScoreBoard      };
  else if (page.indexOf('/index') >= 0 || page == '/') init = {id : '#index'         , func : initPageIndex           };
    //idは他所で判定に使用しているため、設定ページには'setting'を必ず付け、設定ページ以外に'setting'を付けてはいけない

  if (init.id != '') {
    $(document).on('pageshow', init.id, init.func);
  }
  $.ajaxSetup({type    : 'POST',
               dataType: 'json',  // サーバから返されるデータの型
               cache   : false,   // 通信結果のキャッシュ
               success : cbSendAjaxSuccess,  // 通信成功時に呼ばれる関数
               error   : cbSendAjaxError,    // 通信失敗時に呼ばれる関数
               complete: cbSendAjaxComplete, // 通信完了後処理
               timeout : 5000  // 通信タイムアウト
  });
  
  g_web.url_opt = window.location.search;
  
  // 動画取得方式
  if (g_get['view']) {
      g_view.mode = g_get['view'];  // URLにview=pushでサーバープッシュ/=getでクライアントプル
  } else {
      // ブラウザにより動画表示方法(サーバープッシュ/クライアントプル)を判別
      if (g_UserAgent.indexOf('firefox') >= 0) {
          //firefoxのバージョンは最後にある
          var top = g_UserAgent.indexOf('firefox/');
          var end = g_UserAgent.length;
          var c_version = g_UserAgent.substring(top+8,end);
          var version = c_version - 0;
          if(version >= 37){    //37.0以上
              g_view.mode = 'get';    // firefoxはクライアントプル
          }else{
              g_view.mode = 'push';    // firefoxはサーバープッシュ
          }
      } else if (g_UserAgent.indexOf('chrome')  >= 0) {
          g_view.mode = 'push';    // chromeはサーバープッシュ
      } else if (g_UserAgent.indexOf('ipad') >= 0) {
          if (g_UserAgent.indexOf('os 4') >= 0 || g_UserAgent.indexOf('os 5') >= 0){
              g_view.mode = 'push';    // iPad os 4/5 はサーバープッシュ
          }else{
              g_view.mode = 'get';    // iOS6はクライアントプル
          }
      } else if (g_UserAgent.indexOf('iphone')  >= 0) {
          if (g_UserAgent.indexOf('iphone os 4') >= 0 || g_UserAgent.indexOf('iphone os 5') >= 0){
              g_view.mode = 'push';    // iphone os 4/5 はサーバープッシュ
          }else{
              g_view.mode = 'get';    // iOS6はクライアントプル
          }
      } else {
          g_view.mode = 'get';    // IE、Androidはクライアントプル
      }
  }
});

// ページ共通イベント //////
// ナビゲータクリック
function clickNaviPlMeta(e) { clickNavi(this.id, e, 'pl_meta'); }  // プランニングメタデータ
function clickNaviEdMeta(e) { clickNavi(this.id, e, 'ed_meta'); }  // クリップメタデータ
function clickNaviRemocon(e){ clickNavi(this.id, e, 'remocon'); }  // リモートビュー
function clickNaviSetting(e){ clickNavi(this.id, e, 'setting'); }  // 設定
function clickNaviRemoCam(e){ clickNavi(this.id, e, 'camctrl'); }  // カメラ制御
function clickNavi(btn_id, e, id)
{
  e.preventDefault();  // タブレットにてe.preventDefaultでスクロールを止めないとvmouseupが取得できないことがある
  if (changeNaviClolor(btn_id, e.handleObj.origType) == false)  // ボタン色変更
    return;
  g_web.changing_page = id;
  SendPageChange();
}
function SendPageChange()
{
  // ID保存
  var id = g_web.changing_page;
  var page = g_web.page[id]

  // PageChange送信前に遷移ページ先の状態を見て警告を表示する。
  changePage(g_web.allowed_page[page.allowed], id, null);
  
  // ページ変更コマンド送信
  SendCommand('PageChange', {Page:page.no}, {
    success : function(data, dataType) {
      if (checkResCommand(data, {func:SendPageChange, time:100}) == false) {  // コマンド応答チェック
        if (g_web.retry.count == g_web.retry.max) {
          setTimeout(function (){document.location = g_web.page.index.path}, 500);  // カメラとのセッションが切れている場合は送信に失敗するので、TOPページに遷移する
        }
        return;
      }
      // 応答結果によりページ遷移やメッセージ表示を行う
      changePage(data.Response.Data.AllowedPage[page.allowed], id, page.path);
      g_web.changing_page = '';
    }
  });
}
// ページ遷移
// 引数 allowed_page: 遷移先の許可情報による動作
//      id          : 遷移先ページID index(トップ)/pl_meta(プランニングメタデータ)/ed_meta(クリップメタデータ)/remocon(リモコン)/camctrl(カメラ制御)/setting(設定)
//      path        : 遷移先パス。指定が無い場合は遷移しない
function changePage(allowed_page, id, path)
{
  switch (allowed_page) {
  // 表示許可
  case ALLOWED_PAGE.ALLOWED:
    if (g_web.pending_page){
      g_web.pending_page = '';
    }
    if (path) {  // 表示許可、path指定がある場合はページ移動
      if (g_web.live_view == true && id != 'rimocon') {  // 現在ライブビュー実行中で他のページへ移る場合は停止命令を送り、成功/失敗に関わらずページ遷移
        SendCommand('MonitorStop', null, {
          success: function() {
            g_web.live_view = false;
            change_page() },
          error  : function() {
            g_web.live_view = false;
            change_page() }
        });
      } else if (id == 'ed_meta'){  //クリップリスト遷移でFTPエラーをクリアして遷移
        //data.Response.Data.Ftp.Errを参照するのがベター
        SendSetWebFtpResponse(FTP_OPERATE.WEBFTP_RES_ERROR_CLEAR,change_page);  //WEBFTP_RES_ERROR_CLEAR
      } else {
        change_page();  // ライブビュー実行時以外は通常遷移
      }
    }
    break;
  // 保留中
  case ALLOWED_PAGE.PENDING:
    if (g_web.pending_page == '')
      g_web.pending_page = id;  // 保留中はIDのみ設定、ステータス取得により遷移する
    break;
  // 本体がカメラモードではない
  case ALLOWED_PAGE.NOT_IN_CAMERA_MODE:
    if (g_web.pending_page == '') {  // 未表示の場合は警告表示
      g_web.pending_page = id;
      showPopup('RequestCameraMode');
    }
    break;
  // 本体がサムネイルモードではない
  case ALLOWED_PAGE.NOT_IN_THUMBNAIL_MODE:
    if (g_web.pending_page == '') {  // 未表示の場合は警告表示
      g_web.pending_page = id;
      if(g_web.edit_mode_ok != true){
        showPopup('RequestEdMetaMode');
      }
    } else if (g_web.pending_page == 'ed_meta') {  // 待機中に本体でキャンセルされた場合は警告表示消去
       g_web.edit_mode_ok = false;
//      g_web.pending_page = '';
//すぐに閉じてしまうため      closePopup();  // ポップアップを閉じる
    }
    break;
  // ユーザーによりキャンセルされた
  case ALLOWED_PAGE.USER_CANCEL:
    if (g_web.pending_page) {
      g_web.pending_page = '';
      closePopup();  // メッセージ消去
    }
    break;
  // REC中
  case ALLOWED_PAGE.ON_RECORDING:
    if (g_web.msg_id == ''){
      showPopup('DisableOperateForRecording');
    }
    break;
  // メニュー表示中
  case ALLOWED_PAGE.MENU_OPENED:
    if (g_web.msg_id == ''){
      if (g_web.pending_page == 'ed_meta') {  //切り替え画面
        showPopup('RequestEdMetaMode');
      }else{
        showPopup('DisableOperateAtOperatingCamera');
      }
    }
    break;
  // ストリーミング中
  case ALLOWED_PAGE.STREAMING:
    if (g_web.msg_id == ''){
      showPopup('ErrStreaming');
    }
    break;
  // FTP転送中
  case ALLOWED_PAGE.FTP_TRANSPORT:
    if (g_web.msg_id == ''){
      if(id == 'ed_meta'){  //転送中にFTP操作したいため許す
        if (path) {  //パスがあったら遷移するただし転送ページ表示
          change_page();  //エラーを消してしまうので普通に遷移
        }
        break;
      }
      showPopup('ErrFTP');
    }
    break;
  // SDI入力中
  case ALLOWED_PAGE.SDI_INPUT:
    if (g_web.msg_id == ''){
      showPopup('DisableViewRemoteAtInputSDI');
    }
    break;
  // 記録映像解像度HD+Web中
  case ALLOWED_PAGE.HD_WEB_CODEC:
    if (g_web.msg_id == ''){
      showPopup('DisableViewRemoteInHDWeb');
    }
    break;
  // ユーザーアップデート中
  case ALLOWED_PAGE.USER_UPDATING:
  default:
    //showPopup('NoResponse');
    break;
  }
  // ページ遷移
  function change_page() {
    if (id != 'setting_ftp'){  // FTP設定以外はURLからpage=meta/page=clipを削除.先頭が'&'になった場合は'?'に置換
      g_web.url_opt = window.location.search.replace(/[?&]page=(meta|clip)/, '').replace(/^&/, '?');
    }
    // locationを変えてページ移動
    document.location = path + g_web.url_opt;
  }
}

// マウス押下、タップ、キーボード入力
function keyDown(e)
{
  g_bUpdateLifeTime = true;  // lifetime更新フラグを立てる
}

// ページ共通処理 //////////
var g_b_status_count = 0;
// ステータス取得(新)
// fn_get_status : ページ固有のGetStatus処理用関数
// fn_session    : ページ固有のSession処理用関数
function GetStatus(fn_get_status, fn_session)
{
  if (g_web.status_pause == true) {  // ポーズフラグがある場合はコマンド送信せずリトライ
    get_status();
    return;
  }
  
  SendCommand('GetCamStatus', null, {
    // コマンド成功
    success: function(data, dataType) {
      try {
        if (g_dbg_msg_level >= 6){
          DebugMsg(DBGMSG.STATUS, 'GetStatus Response=<br />'+ JSON.stringify(data), true);  // デバッグ表示
        }
        if (checkResCommand(data, {func:GetStatus, time:500}) == false){  // コマンド応答チェック
          return;
        }
        checkStatus(data);  // ステータスチェック
        
        // ページ別ステータス取得処理(設定時)
        if (fn_get_status){
          fn_get_status(data.Response.Data);
        }
        // 各ページ許可の状態を保存
        g_web.allowed_page = data.Response.Data.AllowedPage;
        // ステータス再取得
        get_status();
      } catch (e) {
        DebugMsg(DBGMSG.ERROR, 'GetCamStatus Error msg='+ e.message +' cnt='+ g_b_status_count);
        DebugMsg(DBGMSG.JSON, 'e='+ JSON.stringify(e).replace(/\\n/g, '<br />'));
        get_status();
      }
    },
    error: function() {  // 失敗
      DebugMsg(DBGMSG.ERROR, 'GetCamStatus Error');
      get_status();
    }
  });
  // ステータス再取得(10回毎にセッション更新)
  function get_status()
  {
    if (g_b_status_count % 10 == 0) {
//    if (g_b_status_count % 3 == 0) {
      setTimeout(function (){ Session(fn_get_status, fn_session) }, 100);  // セッション更新
    } else {
      setTimeout(function (){ GetStatus(fn_get_status, fn_session) }, 500);  // ステータス取得
    }
    g_b_status_count++;
  }
}
// セッション更新
function Session(fn_get_status, fn_session)
{
  var params = 'Update='+(g_bUpdateLifeTime ? "True":"False");   // lifetime更新要求あり/なし設定
  
  SendUserData('Session', params, {
    success : function(data, dataType) {
      try {
        if (data.Session == 'NG')
          return;  // セッションがない時は終了
        
        g_bUpdateLifeTime = false;
        
        // ページ別セッション更新(設定時のみ)
        if (fn_session)
          fn_session(data);
        
        get_status();
      } catch (e) {
        DebugMsg(DBGMSG.ERROR, 'Session Error msg='+ e.message +' cnt='+ g_b_status_count, true);
        DebugMsg(DBGMSG.JSON, 'e='+ JSON.stringify(e).replace(/\\n/g, '<br />'));
        get_status();
      }
    },
    error: function() {  // 失敗
      DebugMsg(DBGMSG.ERROR, 'Session Error');
      get_status();
    }
  });
  // ステータス再取得
  function get_status () {
    setTimeout(function (){ GetStatus(fn_get_status, fn_session) }, 100);  // ステータス取得
  }
}

// ページステータスチェック
function checkStatus(data)
{
  var allowed_page = data.Response.Data.AllowedPage;
  
  // ページ遷移保留確認
  if (g_web.pending_page) {
    // 保留時はステータスを確認してALLOWEDになったらページ遷移する
    switch (g_web.pending_page) {
      case 'pl_meta': changePage(allowed_page.PlanningMetadata, 'pl_meta', '/planning_meta.php' ); break;
      case 'ed_meta': changePage(allowed_page.EditMetadata,     'ed_meta', '/edit_meta.php'     ); break;
      case 'remocon': changePage(allowed_page.ViewRemote,       'remocon', '/remote_control.php'); break;
      case 'camctrl': changePage(allowed_page.CameraControl,    'camctrl', '/camera_control.php'); break;
      case 'setting': changePage(allowed_page.Setting,          'setting', '/setting.php'       ); break;
    }
  }
  // WebON/OFFをチェック
  if (g_web.page_id != 'index') {
    if (data.Response.Data.WebAccess == 'Off') {
      showPopup('WebOff');
      return;
    }
  }
  // どのステータスで確認するかを設定
  var allow_status;
  switch (g_web.page_id) {
    case 'pl_meta'          : allow_status = allowed_page.PlanningMetadata; break;
    case 'ed_meta'          : allow_status = allowed_page.EditMetadata;     break;
    case 'remocon'          : allow_status = allowed_page.ViewRemote;       break;
    case 'camctrl'          : allow_status = allowed_page.CameraControl;    break;
    case 'setting'          :
    case 'setting_web'      :
    case 'setting_setup'    :
    case 'setting_ftp'      :
    case 'setting_streaming':
      if (g_web.pending_page)
        return;  // ページ遷移中は警告しない(ポップアップ表示時にMENU_OPENEDとなるため)
      allow_status = allowed_page.Setting;
      break;
    case 'index' :                   return;  // トップページは終了
    default      : alert('no page'); return;
  }
  // 警告表示確認
  switch (allow_status) {
  case ALLOWED_PAGE.NOT_IN_CAMERA_MODE   : showPopup('NotInCameraMode'            ); break;
  case ALLOWED_PAGE.NOT_IN_THUMBNAIL_MODE:
    if (ftp_web_phase == FTP_WEB_PHASE.IDOL){  //転送後カメラモードになるので転送中はカメラモードを許す
      if(g_web.msg_id != 'UploadComplete'){  //完了しましたポップアップが出ているときは更新しない
        showPopup('CancelClipMetaAtCamera'     );  //カメラ本体で「クリップ・メタデータ編集モード」がキャンセルされました
      }
    }
    break;
  case ALLOWED_PAGE.ON_RECORDING         : showPopup('DisableEditMetaAtStartRec'  ); break;
  case ALLOWED_PAGE.MENU_OPENED          :
    if (g_web.msg_id == ''){  //何も表示されていなかったら出す
      showPopup('DisableOperateAtOperatingCamera');  //カメラ本体が操作中のためこの機能は実行出来ません
    }
    break;
  case ALLOWED_PAGE.STREAMING            : showPopup('StartStreaming'             ); break;
//WEBFTP
  case ALLOWED_PAGE.FTP_TRANSPORT        :  //エディットメタデータはFTP中でも動作
    switch(g_web.page_id){
    case 'ed_meta'          : break;
    case 'pl_meta'          :
    case 'remocon'          :
    case 'camctrl'          :
    case 'setting'          :
    case 'setting_web'      :
    case 'setting_setup'    :
    case 'setting_ftp'      :
    case 'setting_streaming': showPopup('StartFTP'                   ); break;
    case 'index' : break;
    default      : break;
    }
    break;
  case ALLOWED_PAGE.HD_WEB_CODEC        :  //記録映像解像度HD+Web中はビューできない
    switch(g_web.page_id){
    case 'remocon'          : showPopup('DisableViewRemoteInHDWeb'    ); break;
    default                 : break;
    }
    break;
  case ALLOWED_PAGE.ALLOWED:
    if((g_web.msg_id == 'DisableOperateAtOperatingCamera' && g_web.page_id.indexOf('setting') >= 0)
     ||(g_web.msg_id == 'NotInCameraMode' && g_web.page_id == 'camctrl')) {
      
      if(g_web.page_id.indexOf('setting') >= 0){
        //設定子ページの場合は、設定ページ先頭にページ遷移
        //子ページはALLOWステータスがないので直接遷移するための判断ができない
        g_web.changing_page = 'setting';
        SendPageChange();
      }
      // ステータスがALLOWEDに変わった場合、ポップアップを閉じる
      closePopup();
      if (g_contents) {
        $(g_contents)[0].style.display = 'block';
        g_contents = '';
      }
    }
    break;
  }
}

// モデル情報取得
// fn_get_status : ページ固有のGetStatus処理用関数
// fn_session    : ページ固有のSession処理用関数
function GetModel(fn_get_status,fn_session)
{
  SendCommand('GetSystemInfo', null, {
    // コマンド成功
    success: function(data, dataType) {
        if (g_dbg_msg_level >= 6){
          DebugMsg(DBGMSG.STATUS, 'GetSystemInfo Response=<br />'+ JSON.stringify(data), true);  // デバッグ表示
        }
        
        if (checkResCommand(data) == false){  // コマンド応答チェック
          return;
        }
        if (fn_get_status){
          fn_get_status(data.Response.Data);
        }
    },
    error: function() {  // 失敗
      DebugMsg(DBGMSG.ERROR, 'GetSystemInfo Error');
    }
  });
}


// コマンドCGI送受信
// 引数:command    :コマンド文字列
//      params     :コマンド引数
//      callback   :コマンド応答関数(success=成功時,error=失敗時,complete=完了時)
//      opt_to     : 応答タイムアウト時間(任意、msec、無い場合は5秒)
function SendCommand(command, params, callback, opt_to)
{
  // 送信JSON作成
  var obj = {Request:{}};
  obj.Request.Command   = command;
  obj.Request.SessionID = GetCookie('SessionID');
  if (params)
    obj.Request.Params = params;
  // オプション設定
  var options = {url:'cgi-bin/cmd.cgi', data: JSON.stringify(obj), processData: false, timeout:(opt_to ? opt_to : 5000)}
  // Ajax通信
  g_ajax.cmd_name = command;
  SendAjax(options, callback)
}
function SendUserData(command, params, callback, opt_to)
{
  // 送信文字列作成
  var str_data = 'Command='+ command;
  if (params)
    str_data += '&'+ params;
  // オプション設定
  var options = {url:'utility.php', data: str_data, timeout:(opt_to ? opt_to : 5000)}
  // Ajax通信
  g_ajax.cmd_name = command;
  SendAjax(options, callback);
}
// 警告表示用タグ取得
function GetMessage(key, callback, opt_to)
{
  var str_url = 'message.php?key='+ key;
  if (g_web.url_opt)
    str_url += '&'+ g_web.url_opt.replace(/\?/, '');
  // オプション設定
  var options = {type:'GET', url:str_url, dataType:'text', timeout:(opt_to ? opt_to : 5000)}
  // Ajax通信
  g_ajax.cmd_name = key;
  SendAjax(options, callback);
}
// メタデータ取得/設定
function SendMetadata(command, params, callback, opt_to)
{
  // 送信JSON作成
  var obj = {'Request':{}};
  obj.Request.Command = command;
  if (params)
    obj.Request.Params = params;
  // オプション設定
  var options = {url:'cgi-bin/metadata.cgi', data: JSON.stringify(obj), processData: false, timeout:(opt_to ? opt_to : 5000)}
  // Ajax通信
  g_ajax.cmd_name = command;
  SendAjax(options, callback);
}
// Settings取得/設定
function SendSettings(func, params, callback, opt_to)
{
  // 送信JSON作成
  var obj = {};
  obj.Function = func;
  if (params)
    obj.Param = params;
  // オプション設定
  var options = {url:'/settings_lib.php', data: JSON.stringify(obj), processData: false, timeout:(opt_to ? opt_to : 5000)}
  // Ajax通信
  g_ajax.cmd_name = func;
  SendAjax(options, callback);
}
// Ajax通信
// options : ajax通信用オプション引数
// callback: ajax通信用コールバック関数
function SendAjax(options, callback)
{
  if (g_ajax.enable == false) {
    DebugMsg(DBGMSG.SEND, 'g_ajax.enable == false cmd='+ g_ajax.cmd_name +' length='+ g_ajax.queue.length);
    // Ajax通信不可時
    if (g_ajax.queue.length > g_ajax.max)
      g_ajax.queue.shift();  // 溜まりすぎた場合は昔のを捨てる
    // キューにデータを貯める
    g_ajax.queue.push({opt:options, cb:callback});
    return;
  }
  // Ajax通信
  g_ajax.enable  = false;       // Ajax通信禁止
  g_ajax.opt     = options;
  g_ajax.cb      = callback;
  $.ajax(options);
}
// 通信成功時に呼ばれる関数
function cbSendAjaxSuccess(data, dataType)
{
  if (g_ajax.cb && g_ajax.cb.success)  // コマンド別に定義したコールバック関数実行
    g_ajax.cb.success(data, dataType);
}
// 通信失敗時に呼ばれる関数
function cbSendAjaxError(XMLHttpRequest, textStatus, errorThrown)
{
  DebugMsg(DBGMSG.JSON, '$.ajax error status='+ textStatus +' opt='+ JSON.stringify(g_ajax.opt));
  // エラー時は何回かリトライする
  if (g_ajax.time.count < g_ajax.time.max) {
    // タイムアウト時は指定時間まで、その他エラー時は5回リトライする
    if (textStatus == 'timeout')
      g_ajax.time.count += g_ajax.opt.timeout + 1000;
    else
      g_ajax.time.count += g_ajax.time.max/5;
    
    setTimeout(function () {
      g_ajax.enable = true;  // Ajax通信許可
      SendAjax(g_ajax.opt, g_ajax.cb);
    }, 1000);
  } else {
    if (g_ajax.cb && g_ajax.cb.error)  // コマンド別に定義したコールバック関数実行
      g_ajax.cb.error(XMLHttpRequest, textStatus, errorThrown);
  }
}
// 通信完了後処理
function cbSendAjaxComplete(XMLHttpRequest, textStatus, errorThrown)
{
  DebugMsg(DBGMSG.AJAX, '$.ajax complete status='+ textStatus +' cmd='+ g_ajax.cmd_name);
  if (textStatus != 'success')
    return;
  
  g_ajax.time.count = 0;  // タイムカウントクリア
  
  if (g_ajax.queue.length > 0) {
    // キューにデータが溜まっている場合は取り出して通信する
    var que = g_ajax.queue.shift();
    setTimeout(function (){
      g_ajax.enable = true;  // Ajax通信許可
      SendAjax(que.opt, que.cb);
    }, 100);
  } else {
    g_ajax.enable = true;  // Ajax通信許可
  }
  
  if (g_ajax.cb && g_ajax.cb.complete)  // コマンド別に定義したコールバック関数実行
    g_ajax.cb.complete(XMLHttpRequest, textStatus, errorThrown);
}
// ポップアップ表示
function showPopup(key, cbPopup)
{
  if (g_web.msg_id == key){
    return;
  }
  var callback = {
    success : showPopupSuccess,
    error   : showPopupError
  };
  // 引数設定時は追加
  if (cbPopup) {
    if (cbPopup.success){
      callback.success = cbPopup.success;
    }
    if (cbPopup.error  ){
      callback.error   = cbPopup.error  ;
    }
  }
  
  // 追加用警告HTML取得
  g_web.msg_id = key;
  GetMessage(key, callback);
}
// デフォルトポップアップ表示成功関数
function showPopupSuccess(data)
{
  $('div#message').remove();              // 前回表示の警告があれば削除
  $('div#'+ g_web.page_id).append(data);  // 警告表示
  if (data.indexOf("class='msg_btn'") >= 0)
    $('.msg_btn')[0].focus();  // ボタンがある場合はフォーカスを移動 (入力フィールドが残ってしまうため#157)
}
// デフォルトポップアップ表示失敗関数
function showPopupError()
{
  DebugMsg(DBGMSG.ERROR, 'showPopupError key='+ g_web.msg_id);
  g_web.msg_id = '';
}
// ポップアップ消去
function closePopup()
{
  g_web.msg_id = '';
  $('div#message').remove();
}
// 待ち表示表示
function showWait(key)
{
  var callback = {
    success : showWaitSuccess,
    error   : showWaitError
  };
  // 追加用警告HTML取得
  g_web.msg_id = key;
  GetMessage(key, callback);
  // デフォルト待ち表示成功関数
  function showWaitSuccess(data)
  {
    $('div#msg_wait').remove();   // 前回表示の待ちがあれば削除
    $('.content').append(data);  // 警告表示
  }
  // デフォルト待ち表示失敗関数
  function showWaitError()
  {
    DebugMsg(DBGMSG.ERROR, 'showWaitError key='+ g_web.msg_id);
    g_web.msg_id = '';
  }
}
// 待ち消去
function hideWait()
{
  g_web.msg_id = '';
  $('div#msg_wait').remove();
}

// ↓CSSのtext-overflow設定で3点表示が可能なのでCSS処理に変更
// 最大文字列長を指定してタグに文字列を設定
// 引数  ：id=文字を入力するタグのID(widthを指定しないインライン要素), src=入力文字, max=最大ピクセル数
//function setTrimString(id, src, max)
//{
//  $(id)[0].innerHTML = src;
//  if ($(id)[0].offsetWidth > max) {
//    // srcの長さがmax以下になるまで短くする
//    for (var i = 1; i < src.length; i++) {
//      $(id)[0].innerHTML = src.slice(0, -i) + '...';
//      if ($(id)[0].offsetWidth <= max)
//        break;
//    }
//  }
//}

// メッセージボタンクリック トップページ移動
function clickMsgBtnTop()
{
  g_web.msg_id = '';
  document.location = '/index.php' + g_web.url_opt;
}
// メッセージボタンクリック 閉じる
function clickMsgBtnClose()
{
  closePopup();
}
// メッセージ クリップメタデータ/ビューリモート移行キャンセル
function clickChangeCancel()
{
  g_web.pending_page = '';
  closePopup();  // ポップアップを閉じる
  // 元ページへのページ変更コマンドを送る(ページ遷移は行わない)
  SendCommand('PageChange', {Page:PAGE.TOP});
}
// メッセージ 修正モード移行キー発行
function clickChangeEditModeKey()
{
  g_web.pending_page = 'ed_meta';
//  g_web.pending_page = '';
  // 元ページへのページ変更コマンドを送る(ページ遷移する)
  closePopup();  // ポップアップを閉じる
  //再度ポップアップしないようにフラグを立てる
  g_web.edit_mode_ok = true;
  SendSetWebKeyEnter();
//  SendCommand('PageChange', {Page:PAGE.CLIP_META});
}
function SendSetWebKeyEnter()
{
  s_cmd = {
    param : { Kind : 'Disptv', Key : 'Set' }
  }
  DebugMsg(DBGMSG.SEND, JSON.stringify(s_cmd.param));
  SendCommand('SetWebKeyEvent', s_cmd.param, {
    success: function(data) {  // 成功
      DebugMsg(DBGMSG.SEND, 'SendSetWebKeyEvent Success');
      if (checkResCommand(data, {func:SendSetWebKeyEnter, time:100}) == false){  // コマンド応答チェック
        return;
      }
    },
    error: function() {  // 失敗
      DebugMsg(DBGMSG.SEND, 'SendSetWebKeyEvent Error');
    }
  });
}

// メッセージボタンクリック FTPエラーをクリアして閉じる
function clickMsgBtnErrClearClose()
{
  SendSetWebFtpResponse(FTP_OPERATE.WEBFTP_RES_ERROR_CLEAR,close_top);  //WEBFTP_RES_ERROR_CLEAR

  function close_top(){
    closePopup();  //閉じるだけ
    clickMsgBtnTop();  //トップに戻る
  };
}
function SendSetWebFtpResponse(param,func)
{
  var send_cmd = 'WebFtpOperateResponse';
  var send_param = {Response : '0'};
  send_param['Response']=param;
  SendCommand(send_cmd, send_param, {
    success: function(data) {  // 成功
      DebugMsg(DBGMSG.SEND, 'SendSetWebFtpResponse Success');
      func();
      if (checkResCommand(data, {func:SendSetWebFtpResponse, time:100}) == false){  // コマンド応答チェック
        return;
      }
    },
    error: function() {  // 失敗
      DebugMsg(DBGMSG.SEND, 'SendSetWebFtpResponse Error');
    }
  });
}

// プランニング/クリップメタデータ保存確認
// meta_type: 種類 'Planning'/'Clip'
// slot     : スロット 'A'/'B'、Planningの場合は''
// index    : クリップ番号、Planningの場合は0
function MetadataSaveConf(meta_type, slot, index)
{
  // 入力チェック
  var input = {
    title1     :{name: $('#lbl_title1'     )[0].innerHTML, val: $('#title1')[0].value, func:IsAscii, must:false, min:1, max:  63},
    title2     :{name: $('#lbl_title2'     )[0].innerHTML, val: encodeURIComponent($('#title2'     )[0].value), func:IsByte , must:false, min:1, max: 127},
    description:{name: $('#lbl_description')[0].innerHTML, val: encodeURIComponent($('#description')[0].value), func:IsByte , must:false, min:1, max:2047},
    creator    :{name: $('#lbl_creator'    )[0].innerHTML, val: encodeURIComponent($('#creator'    )[0].value), func:IsByte , must:false, min:1, max: 127}
  };
  if (checkInput(input) == false)
    return;
  // パラメータ保存
  g_meta = {type: meta_type, params: {}}
  if (slot && index > 0) {
    g_meta.params.Slot    = slot;
    g_meta.params.IndexNo = index;
  }
  g_meta.params.Metadata = {Title1     : encodeURIComponent(input.title1.val),
                            Title2     : input.title2.val,
                            Description: input.description.val,
                            Creator    : input.creator.val};
  // ポップアップ表示
  showPopup('ConfSave'+ meta_type +'Meta');
}
// プランニング/クリップメタデータ保存OK
// MetadataSaveConfで設定した値を使用する
function MetadataSaveOK()
{
  // メタデータ送信
  SendMetadata('Set'+ g_meta.type +'Metadata', g_meta.params, {
    // 成功
    success: function (data, dataType) {
      if (checkResCommand(data, {func:MetadataSaveOK, time:100}) == false) {  // コマンド応答チェック
        if (data.Response.Result != 'Success')
          showPopup('FailSave'+ g_meta.type +'Meta');  // 失敗表示
        return;
      }
      showPopup('SuccessSave'+ g_meta.type +'Meta');  // 成功表示
    },
    // 失敗
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      showPopup('FailSave'+ g_meta.type +'Meta');     // 失敗表示
    }
  }, 60000);
}

// ライブビュー表示
var live_ratio =0;  //画角情報

function LiveView()
{
  //表示する画像のサイズと位置を指定する
  if(live_ratio == 0){  //16:9
    $('#ee')[0].style.left = g_bMobile ? '0' : '0';
    $('#ee')[0].style.width = g_bMobile ? '320px' : '600px';
    $('#ee')[0].style.height = g_bMobile ? '180px' : '333px';
  }else{  //4:3
    $('#ee')[0].style.left = g_bMobile ? '40px' : '76px';
    $('#ee')[0].style.width = g_bMobile ? '240px' : '444px';
    $('#ee')[0].style.height = g_bMobile ? '180px' : '333px';
  }
  DebugMsg(DBGMSG.VIEW, 'LiveView() mode = '+ g_view.mode);

  if (g_view.mode == 'push') { // サーバープッシュ
    $('#ee')[0].style.visibility = 'visible';
    $('#ee')[0].src = 'cgi-bin/mjpeg.cgi' + location.search;
    g_web.live_view = true;
    $('#ee')[0].onerror = function () {
      // 黒画面になったら再起動
      $('#ee')[0].style.visibility = 'hidden';
      $('#ee')[0].src = '';
      if (g_view.retry.count < g_view.retry.max) {
        setTimeout(LiveView, 5);
        g_view.retry.count++;
      }
    }
  } else { // クライアントプル
    g_web.live_view = true;
    SendCommand('MonitorStart', null, {
      success : function(data, dataType) {
        // DisableErrorに備えリトライ処理追加#208,209
        if (data.Response.Result != 'Success') {
          if (g_view.retry.count < g_view.retry.max) {
            setTimeout(LiveView, 5);
            g_view.retry.count++;
          }
          return;
        }
        IELiveView();
      }
    });
  }
}
// ライブビュー表示(クライアントプル)
function IELiveView()
{
  $('#ee')[0].src = 'cgi-bin/get_jpg.cgi?'+ new Date().getTime();
  $('#ee')[0].onload  = function () { setTimeout(IELiveView, 5); }
  $('#ee')[0].onerror = function () { setTimeout(IELiveView, 5); }
}

// コマンド応答チェック
function checkResCommand(data, retry)
{
  if (!data)
    return false;
  if (data.Response.Result == 'DualExeError'
   || data.Response.Result == 'SessionError') {
    if (retry) {
      if (g_web.retry.count < g_web.retry.max) {
        setTimeout(retry.func, retry.time);  // 2重起動,セッションエラー時は再送する
        g_web.retry.count++;                 // 何回かリトライしてダメなら終了
      }
    }
    return false;
  }
  g_web.retry.count = 0;
  
  if (data.Response.Result == 'Success'){
    return true;
  }
  return false;
}

// 設定応答チェック
function checkResSetting(data)
{
  if (data == null || data.Result != 'Success') {
    return false;
  }
  return true;
}
// 文字の整合性チェック
function checkInput(input)
{
  var error = [];
  for (var id in input) {
    var src = input[id];
    // 必須項目チェック
    if (src.must == true && src.val.length == 0) {
      error.push(src.name);
      continue;
    }
    if (src.val.length > 0) {
      if (src.func == IsByte) {
        // バイト長チェックの場合は特殊処理
        if (src.func(src.val, src.min, src.max) == false) {
          error.push(src.name);
          continue;
        }
      } else {
        // 文字長チェック
        if (src.val.length < src.min || src.max < src.val.length) {
          error.push(src.name);
          continue;
        }
        // 文字チェック
        if (src.func(src.val) == false) {
          error.push(src.name);
          continue;
        }
      }
    }
  }
  if (error.length > 0) {
    // エラーがある場合は警告表示
    showPopup('ErrInputText', {
      success: function (data, dataType) {
        showPopupSuccess(data, dataType);  // 警告表示
        // 文字列を追加
        var str = '';
        for (var i = 0; i < error.length; i++)
          str += (i % 2 ? ' ':'<br />')+'・'+ error[i];
        $('#msg_txt').append(str);
      }
    });
    return false;
  }
  return true;
}
// アスキー
function IsAscii(str)
{
  return str.match(/^[\x20-\x7E]+$/) ? true : false;
}
// バイト(ユニコード)
function IsByte(str, min, max)
{
  var per  = str.match(/%/g);
  var byte = str.length - (per ? per.length*2 : 0);  // 文字数-文字列内の%の数×2でバイト数を算出
  
  return (min <= byte && byte <= max) ? true : false;
}
// IPアドレス
function IsIP(str)
{
  if (str.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/) == null)
    return false;
  var ip = str.split(".");
  for (var i = 0; i < 4; i++) {
    if (ip[i] < 0 || 255 < ip[i])
      return false;
  }
  return true;
}
// ドメイン名
function IsDomain(str)
{
  return str.match(/^[0-9A-Za-z\-.]+$/) ? true : false;
}
// ポート
function IsPort(str)
{
  if (str.match(/^[0-9]+$/) == null)
    return false;
  return (0 < str && str <= 65535) ? true : false;
}
// RTP用ポート
function IsPortRTP(str)
{
	if (str.match(/^[0-9]+$/) == null)
		return false;
	if (str % 2 != 0)
		return false;
	return (1 < str && str <= 65530) ? true : false;
}
// RTP用 FEC マトリクス
function IsFecMatrix(str)
{
	if (str.match(/^[0-9]+$/) == null)
		return false;
	return (3 < str && str <= 20) ? true : false;
}
// RTP用 FEC マトリクスの合計
function IsRange(str)
{
	return (str <= 100) ? true : false;
}
// 電話番号
function IsPhone(str)
{
  return str.match(/^[0-9\-*#]+$/) ? true : false;
}

// クリックしたボタンの表示色を変更する
// 引数  :img  拡張子を除いたファイル名
//       :eventイベント文字列(vmousedown/mouseout/vmouseup)
//       :id   クリックボタンのID
//       :size 変更画像サイズ
// 戻り値:true=ボタン動作あり, false=ボタン動作なし
function changeColor(img, event, id, size)
{
  if ($(id).css('backgroundImage').indexOf('_dis') > 0)
    return false;  // 禁止の場合は何もしない
  
  switch (event) {
  // マウスダウン
  case 'vmousedown':
    $(id)[0].style.background     = 'url(../img/'+ img +'_press.png)';
    $(id)[0].style.PieBackground  = 'url(../img/'+ img +'_press.png)';
    $(id)[0].style.backgroundSize = size;
    return false;
  // マウスアウト
  case 'mouseout':
    if ($(id).css('backgroundImage').indexOf('_press') > 0) {
      // 押下時のみ表示変更
      $(id)[0].style.background     = 'url(../img/'+ img +'.png)';
      $(id)[0].style.PieBackground  = 'url(../img/'+ img +'.png)';
      $(id)[0].style.backgroundSize = size;
    }
    return false;
  // マウスアップ
  case 'vmouseup' :
    return true;
  default :
    return false;
  }
}

// クリックボタンの表示色を変更する
function changeClickBtnColor(img_name, event, id, button_size)
{
  var img = 'btn_'+ img_name;
  if ($(id).css('backgroundImage').indexOf('_sel') <= 0) {
    // マウスダウン/アウトの処理(選択中以外)
    if (changeColor(img, event, id, button_size) == false){
      return false;
    }
  }
  // マウスアップの処理
  if (event == 'vmouseup') {
    $(id)[0].style.background     = 'url(../img/'+ img +'.png)';
    $(id)[0].style.PieBackground  = 'url(../img/'+ img +'.png)';
    $(id)[0].style.backgroundSize = button_size;
    return true;
  } else {
    return false;
  }
}
// 選択ボタンの表示色を変更する
function changeOptBtnColor(img_name, event, select_id, button)
{
  if ($(select_id).css('backgroundImage').indexOf('_sel') > 0)
    return false;  // 選択中の場合は何もしない
  
  // マウスダウン/アウトの処理
  var img = 'btn_'+ img_name;
  if (changeColor(img, event, select_id, button.size) == false)
    return false;
  
  // マウスアップの処理
  if (event == 'vmouseup') {
    // button配列の全てのidの画像を変える
    for (var i = 0; i < button.id.length; i++) {
      var id = '#btn_' + button.id[i];
      $(id)[0].style.background = (id == select_id) ? 'url(../img/'+ img +'_sel.png)' : 'url(../img/'+ img +'.png)'; //選択/選択外
      $(id)[0].style.backgroundSize = button.size;
    }
    return true;
  } else {
    return false;
  }
}
// ナビゲータの色を変える
function changeNaviClolor(id, event)
{
  if (id.slice(-3) == 'act') {
    // 選択メニュー。表示変化なし
    return (event == 'vmouseup') ? true : false;
  } else {
    // 非選択メニュー
    switch (event) {
    // マウスダウン
    case 'vmousedown':
	  $('#'+id)[0].style.background = '-moz-linear-gradient(#0D0D0D, #514A64)';
	  $('#'+id)[0].style.background = '-webkit-gradient(linear, left top, left bottom, from(#0D0D0D), to(#514A64))';
      return false;
    // マウスアウト
    case 'mouseout':
      $('#'+id)[0].style.background = 'black';
      return false;
    // マウスアップ
    case 'vmouseup' :
      $('#'+id)[0].style.background = 'black';
      return true;
    default :
      return false;
    }
  }
}
// 文字のエスケープ
function escapeHTML(str) {
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
}


///// SucoreInput Only /////
// 文字の整合性チェック
function checkInputScore(input)
{
  var error = [];
  for (var id in input) {
    var src = input[id];
    // 必須項目チェック
    if (src.must == true && src.val.length == 0) {
      error.push(src.name);
      continue;
    }
    if (src.val.length > 0) {
      if (src.func == IsByte) {
        // バイト長チェックの場合は特殊処理
        if (src.func(src.val, src.min, src.max) == false) {
          error.push(src.name);
          continue;
        }
      } else {
        // 文字長チェック
        if (src.val.length < src.min || src.max < src.val.length) {
          error.push(src.name);
          continue;
        }
        // 文字チェック
        if (src.func(src.val) == false) {
          error.push(src.name);
          continue;
        }
      }
    }
  }
  if (error.length > 0) {
    // エラーがある場合は警告表示
    showPopup('ErrInputTextScore', {
      success: function (data, dataType) {
        showPopupSuccess(data, dataType);  // 警告表示
        // 文字列を追加
        var str = '';
        for (var i = 0; i < error.length; i++)
          str += (i % 2 ? ' ':'<br />')+'・'+ error[i];
        $('#msg_txt').append(str);
      }
    });
    return false;
  }
  return true;
}


