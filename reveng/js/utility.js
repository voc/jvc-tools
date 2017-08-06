//デバッグメッセージ種別のレベル設定
var DBGMSG = {
  AJAX      :5,    //5AJAXメッセージ
  JSON      :4,    //3JSONメッセージ
  SEND      :4,    //4コマンド送信
//  RECIEVE    :0,    //xコマンド受信
  UI        :3,    //3ユーザーインターフェース
  TOUCH      :4,    //4ユーザーインターフェース
  LONGTOUCH  :4,    //4ユーザーインターフェース
  KEY        :4,    //4キー
  SLIDER    :4,    //4スライダー
  LANG      :4,    //3言語表示
  LANGOVER  :4,    //4言語オーバーフロー
  INFO      :4,    //4情報
  PLMT        :4,    //xプランニングメタデータ
  CL        :4,    //4クリップリスト
  FTP        :5,    //5FTP
  VIEW      :4,    //xビューリモート
  ZOOM      :4,    //3ズーム
  CC        :4,    //4カメラコントロール
  WP        :4,    //3ホワイトペイント
  SET        :4,    //4設定
  STATUS    :6,    //6カメラステータス
  ERROR      :1    //1エラー
};

// グローバル変数 //////////
var g_get = {};               // Getパラメータ
var g_UserAgent     = '';     // ユーザエージェント
var g_bMobile       = false;  // モバイルフラグ
var g_dbg_msg_level = 0;      // デバッグメッセージ表示レベル
var g_ev_rotation   = '';     // 回転イベント名
var g_dbg_msg = 0;            // デバッグメッセージダイアログ
var g_dbg_model = 0;          // モデル判別

var s_zoom = {     // ページ倍率
  factor : 1.00, // 現在の倍率
//  h : 1.25,      // 横回転時の倍率
  h : 1.2,       // 横回転時の倍率
  v : 1.00       // 縦回転時の倍率
}

var s_bEnableTouch = false;  // タッチ/マウスフラグ
var s_bAndroid     = false;  // アンドロイドフラグ
var s_iOS8     = false;      // iOS8フラグ

var s_shadow = {  // ボタン影
  focus: '0 0 12px #80C0FF',  // フォーカス
  trans: '0 0 12px #FFC080',  // 通信中
  none : ''                   // なし
}
var s_trans_icon_id = '#navi_trans_icon'  // 通信中アイコン
var s_dummy_span_id = '#span_dummy';      // ダミータグ(文字長計算用)


// グローバル関数 /////////
// CSSのピクセルから数値を取得
function PxToN(id, param1, param2)
{
  var num = Number($(id).css(param1).replace('px', ''));
  if (param2)
    num += Number($(id).css(param2).replace('px', ''));  // 第2引数がある場合は加算
  return num;
}
// デバッグ用表示
function DebugMsg(level, str, b_clear)
{
  if (g_dbg_msg)
    g_dbg_msg.Log(level, str, b_clear);
}
// クッキー取得
function GetCookie(key)
{
  var cookie_info = document.cookie.split(';');
  for (var i = 0; i < cookie_info.length; i++) {
    var tar = cookie_info[i].replace(/^\s+|\s+$/g, '');  // 前後のスペースをカットする
    var val_index = tar.indexOf('=');
    if (tar.substring(0, val_index) == key)
      return unescape(tar.slice(val_index + 1));  // キーが引数と一致した場合、値を返す
  }
  return '';
}
// クッキー設定
function SetCookie(key, val)
{
  document.cookie = key + '='+ val +'; expires=Tue, 1-Jan-2030 00:00:00 GMT';  // クッキー保存
}
// クッキー削除
function DelCookie(key)
{
  document.cookie = key + '=; expires=Fri, 31-Dec-1999 23:59:59 GMT;'  // クッキー削除
}

// クラス /////////
// 継承のためのメソッド定義
Function.prototype.inheritance = function (base) {
  //this.prototype = Object.create(base.prototype);
  var F = function(){};
  F.prototype = base.prototype;
  this.prototype = new F();
  
  this.prototype.constructor = this;
  this.base   = base;
  this.parent = base.prototype;
  return this;
};
// Function.prototype.inheritanceでJavascriptクラスを継承をする手順
// 1.親クラスとして関数を定義
//   var BaseButton = function (id) { ... }
// 2.子クラスも同様に関数を定義し、baseとinheritanceを呼び出す
//   var Button = function (btn_id) {
//       Button.base.apply(this, [btn_id]);
//       ...
//   }.inheritance(BaseButton)
// 3.子クラスの関数等をprototypeに追加する
//   $.extend(Button.prototype, {
//       Select: function(){...},
//       ... 
//   });
// 4.実装する
// var btn_test = new Button('#btn_test');
// btn_test.Select();

// ボタン画像パスクラス //////////
var ImgBtnPath = function (normal, press, disable, select, trans) {
  this.normal  = normal;   // 通常時
  this.press   = press;    // 押下時
  this.disable = disable ? disable : normal;  // 禁止時
  this.select  = select  ? select  : normal;  // 選択時
  this.trans   = trans   ? trans   : press;   // 通信時
};
// 画像パスクラス
var ImgPath = function (normal, disable) {
  this.normal  = normal;   // 通常時
  this.disable = disable ? disable : normal;  // 禁止時
};


// ボタンクラス //////////////////
var Button;
// 基本ボタンクラス
// ボタンクラスの中で、表示クラスと操作クラスを所有する
// id : ボタンID
// btn_img : ボタン画像パスクラス
// fn  : ボタン操作関数ハッシュ (fn={click:クリック関数, hold:長押し関数})
// opt : 拡張機能ハッシュ (任意、opt={icon:アイコン情報ハッシュ, lbl:見出し情報ハッシュ})
var BtnBase = function (id, btn_img, fn, opt) {
  this.id = id;
  this.img = btn_img;
  
  // イベント設定
  $(document).on('focus', id, this, this.evFocus);   // フォーカス
  $(document).on('blur' , id, this, this.evBlur);    // フォーカスアウト
  
  // 操作クラス設定
  if (fn.hold){
    this.act = new ActHold(id, fn.hold, fn.click);
  }else{
    this.act = new ActClick(id, fn.click);
  }
  // 通信アイコンクラス設定
  this.transIcon = new TransIcon();
  
  // 変数設定
  this.b_down    = false;  // マウスダウン/タッチスタートフラグ
  this.b_trans   = false;  // 通信中フラグ
  this.b_disable = false;  // 操作禁止フラグ
  this.b_select  = false;  // 選択中フラグ
  this.b_focus   = false;  // フォーカスフラグ
  
  // 定数設定
  this.txt_color_normal = $(id).css('color');  // 通常時のボタン色保存
  this.background_size  = $(id).css('background-size');  // ボタン画像サイズ
  this.shadow = {  // ボタン影
    focus: s_shadow.focus,  // フォーカス
    trans: s_shadow.trans,  // 通信中
    none : ''               // なし
  };
  // 拡張設定(任意)
  if (opt) {
    if (opt.overflow){  // 文字整形クラス opt.overflow = {max_width:最大幅}
      this.overflow = new OverflowString(id, opt.overflow);
    }
    if (opt.icon) {  // 画像アイコン opt.icon = {id:アイコンID, img:ImgPathクラス}
      this.icon = {id      : opt.icon.id,
                   normal  : opt.icon.img.normal,
                   disable : opt.icon.img.disable};
    }
    if (opt.lbl){  // ラベル opt.lbl = {id:ラベルID}
      this.lbl = new Label(opt.lbl.id);
    }
  }
}
// 基本ボタンメソッド
BtnBase.prototype = {
  // ボタン画像変更
  changeImg : function() {
    DebugMsg(DBGMSG.UI, 'button:'+ this.id +' change image');
    var path;
    if (this.b_select)       path = this.img.select;   // 選択時
    else if (this.b_disable) path = this.img.disable;  // 禁止時
    else if (this.b_trans  ) path = this.img.trans;    // 通信時
    else if (this.b_down   ) path = this.img.press;    // 押下時
    else                     path = this.img.normal;   // 通常時
    
    $(this.id)[0].style.background     = 'url('+ path +')';
    $(this.id)[0].style.backgroundSize = this.background_size;
  },
  // ボタン影変更
  changeShadow : function() {
    DebugMsg(DBGMSG.UI, 'button:'+ this.id +' change shadow');
    var shadow;
    if (this.b_disable)    shadow = this.shadow.none;   // 禁止時(消去)
    else if (this.b_trans) shadow = this.shadow.trans;  // 通信表示
    else if (this.b_focus) shadow = this.shadow.focus;  // フォーカス表示
    else                   shadow = this.shadow.none;   // フォーカスアウト(消去)
    
    $(this.id)[0].style.boxShadow       = shadow;
    $(this.id)[0].style.WebkitBoxShadow = shadow;
  },
  
  // ダウン処理
  down : function () {
    DebugMsg(DBGMSG.UI, 'button:'+ this.id +' down trans='+this.b_trans +' disable='+this.b_disable +' down='+ this.b_down);
    if (this.b_down || this.b_disable || this.b_trans){
      return false;  // 押下、禁止、通信時は処理しない
    }
    DebugMsg(DBGMSG.UI, 'button:'+ this.id +' down !!!');
    this.b_down = true;
    this.act.Down();   // ボタン押下操作
    this.changeImg();  // ボタン押下表示
    if(!s_iOS8){   //iOS8ではこの一撃でfixedでなくなるのでやらない
      $(this.id)[0].focus();  // フォーカスを移す
    }
    return true;
  },
  // アップ処理
  up : function () {
    DebugMsg(DBGMSG.UI, 'button:'+ this.id +' up');
    if (!this.b_down || this.b_disable){
      return false;  // 開放、禁止時は処理しない
    }
    DebugMsg(DBGMSG.UI, 'button:'+ this.id +' up !!!');
    this.b_down = false;
    this.act.Up();     // ボタン開放操作
    this.changeImg();  // ボタン通常表示
    
    return true;
  },
  // クリック処理
  click : function() {
    DebugMsg(DBGMSG.UI, 'button:'+ this.id +' click');
    if (this.b_disable || this.b_trans){
      return false;   // 禁止、通信時は処理しない
    }
    DebugMsg(DBGMSG.UI, 'button:'+ this.id +' up !!!');
    this.act.Click();  // ボタンクリック操作
    
    return true;
  },
  // フォーカス処理
  focus : function () {
    DebugMsg(DBGMSG.UI, 'button:'+ this.id +' focus');
    this.b_focus = true;
    this.changeShadow()  // ボタン影フォーカス
  },
  // フォーカスアウト処理
  blur : function () {
    DebugMsg(DBGMSG.UI, 'button:'+ this.id +' blur');
    this.b_focus = false;
    this.changeShadow()  // ボタン影削除
  },
  
  // 外部呼出しメソッド
  // ボタン許可状態設定
  SetStatus : function (b_enable, b_select) {
    if (this.b_disable != b_enable && this.b_select == b_select){
      return;  // フラグ変更が無い場合は処理しない
    }
    DebugMsg(DBGMSG.UI, 'button:'+ this.id +' SetStatus');
    // フラグ設定
    this.b_disable = !b_enable;
    if (this.b_disable == true){
      this.b_down = false;
    }
    this.b_select = b_select;
    
    this.act.Disable(this.b_disable);
    
    // 表示変更
    this.changeImg();        // ボタン
    this.changeShadow();     // 影
    $(this.id)[0].style.color  = b_enable ? this.txt_color_normal : 'gray';  // 文字色
    $(this.id)[0].style.cursor = b_enable ? 'pointer' : 'arrow';             // マウスカーソル
    
    // アイコン設定時
    if (this.icon) {
      $(this.icon.id)[0].src          = b_enable ? this.icon.normal : this.icon.disable;  // アイコン画像
      $(this.icon.id)[0].style.cursor = b_enable ? 'pointer'        : 'arrow';            // マウスカーソル
    }
    // ラベル設定時
    if (this.lbl){
      this.lbl.SetEnable(b_enable);
    }
  },
  // 通信中設定。コマンド通信時はボタン処理不可
  // b_trans : true=通信開始, false=通信終了
  Trans : function (b_trans) {
    DebugMsg(DBGMSG.UI, 'button:'+ this.id +' Trans');
    this.b_trans = b_trans;
    this.act.Trans(b_trans);  // 通信中操作(フラグを立てる)
    this.changeImg();     // ボタン表示変更
    this.changeShadow();  // ボタン影変更
    this.transIcon.Display(b_trans);  // 通信アイコン表示/消去
  },
  // ボタンテキスト設定
  SetText : function(text) {
//    DebugMsg(DBGMSG.UI, 'button:'+ this.id +' SetText');
    if (this.overflow) {
      // 文字整形あり
      this.overflow.Text(text);
    } else {
      // 文字整形なし
      $(this.id)[0].value = text;
    }
  },
  GetID      : function() {
    DebugMsg(DBGMSG.UI, 'button:'+ this.id +' GetID');
    return this.id;        },   // ボタンID取得
  GetDown    : function() {
    DebugMsg(DBGMSG.UI, 'button:'+ this.id +' GetDown');
    return this.b_down;    },   // 押下フラグ取得
  GetTrans   : function() {
    DebugMsg(DBGMSG.UI, 'button:'+ this.id +' GetTrans');
    return this.b_trans;   },   // 通信フラグ取得
  GetDisable : function() {
    DebugMsg(DBGMSG.UI, 'button:'+ this.id +' GetDisable');
    return this.b_disable; },   // 禁止フラグ取得
  GetSelect  : function() {
    DebugMsg(DBGMSG.UI, 'button:'+ this.id +' GetSelect');
    return this.b_select;  },   // 選択フラグ取得
  
  // イベント
  evFocus: function (e) {
    DebugMsg(DBGMSG.UI, 'button:'+ this.id +' evFocus');
    e.data.focus();
  },  // フォーカスイベント
  evBlur : function (e) {
    DebugMsg(DBGMSG.UI, 'button:'+ this.id +' evBlur');
    e.data.blur();
  }   // フォーカスアウトイベント
}
// マウスボタンクラス (BtnBase継承) /////////
var BtnMouse = function (id, btn_img, fn, opt) {
  BtnMouse.base.apply(this, [id, btn_img, fn, opt]);  // 親クラスのコンストラクタ
  // イベント設定
  $(document).on('mousedown', id, this, this.evDown);       // マウスダウン
  $(document).on('mouseup mouseout', id, this, this.evUp);  // マウスアップ/アウト。同等の処理を行う
  $(document).on('click', id, this, this.evClick);          // クリック。Enterキーを可能にするためmouseupとclickに分ける
  
  if (opt) {
    if (opt.icon) {
      // 画像アイコン設定時はアイコンにもイベント設定
      $(document).on('mousedown', opt.icon.id, this, this.evDown);        // マウスダウン
      $(document).on('mouseup mouseout', opt.icon.id, this, this.evUp);   // マウスアップ
      $(document).on('click', opt.icon.id, this, this.evClick);           // クリック
    }
    if (opt.key)  // キー設定時
      this.key = new KeyControl(id, opt.key);
  }
}.inheritance(BtnBase);
// マウスボタンメソッド
$.extend(BtnMouse.prototype, {
  // イベント
  // マウスダウンイベント
  evDown : function (e) {
    e.data.down();
    e.preventDefault();  // 画像アイコンでドラッグさせないためpreventDefaultを呼ぶ
  },
  evUp   : function (e) { e.data.up();    },  // マウスアップイベント
  evClick: function (e) { e.data.click(); }   // クリックイベント
});

// タッチボタンクラス (BtnBase継承) /////////
var BtnTouch = function (id, btn_img, fn, opt) {
  BtnTouch.base.apply(this, [id, btn_img, fn, opt]);  // 親クラスのコンストラクタ
  // イベント設定
  $(document).on('touchstart', id, this, this.evStart);  // タッチ開始
  $(document).on('touchend', id, this, this.evEnd);      // タッチ終了
  $(document).on('touchmove', id, this, this.evMove);    // タッチムーブ
  
  if (opt && opt.icon) { // 画像アイコン設定時はアイコンにもイベント設定
    $(document).on('touchstart', opt.icon.id, this, this.evStart);  // タッチ開始
    $(document).on('touchend', opt.icon.id, this, this.evEnd);      // タッチ終了
    $(document).on('touchmove', opt.icon.id, this, this.evMove);    // タッチムーブ
  }
  
  // 変数定義
  this.pageY = 0;  // タッチ縦位置
  this.tm_move = null;  // タッチムーブタイマー
}.inheritance(BtnBase);
BtnTouch.s_start = false;
// タッチボタンメソッド
$.extend(BtnTouch.prototype, {
  // タッチ開始処理
  start: function (pageY) {
    this.pageY = pageY;
    if (this.down() == false){
      return;
    }
    DebugMsg(DBGMSG.UI, 'touch start pageY='+ this.pageY);
  },
  // タッチ終了処理
  end: function () {
    DebugMsg(DBGMSG.UI, 'touch end');
    // up→clickと実行する
    this.up();
    this.click();
  },
  // タッチムーブ処理
  move: function (pageY) {
    // タッチ開始位置からの移動量を計算
    var diffY = this.pageY - pageY;
    // タッチ開始イベントでpreventDefaultを呼び出したためスクロールしないので、移動量分だけプログラムで移動する
    $(window).scrollTop($(window).scrollTop() + diffY);
    
    DebugMsg(DBGMSG.TOUCH, 'move diffY='+ diffY);
    if (Math.abs(diffY) > 5) {
      // 移動量が一定px以上の場合はクリック処理をキャンセル
      this.act.TouchMove();
      
      if (this.tm_move) {
        clearTimeout(this.tm_move);  // タイマー設定時はリセット後に再設定
      } else {
        DebugMsg(DBGMSG.UI, 'move start diffY='+ diffY);
      }
      // タッチムーブ終了設定。500ms後にupを呼び出す。
      var self = this;
      this.tm_move = setTimeout(function () {
        DebugMsg(DBGMSG.UI, 'move end');
        self.tm_move = null;
        self.up();
      }, 500);
    }
  },
  // イベント
  // タッチ開始イベント
  evStart: function (e) {
    e.preventDefault();  // 長押しメニューを非表示にするためpreventDefaultを呼ぶ
    var touches = e.originalEvent.touches;
    if (touches.length >= 2) {
      DebugMsg(DBGMSG.UI, 'sld touch start touches.length='+ touches.length);
      return;  // 2本指以上の操作の場合は処理しない
    }
    e.data.start(touches[0].pageY);
  },
  // タッチ終了イベント
  evEnd  : function (e) {
    e.data.end();
  },
  // タッチムーブイベント
  evMove : function (e) {
    var touches = e.originalEvent.touches;
    if (touches.length >= 2) {
      DebugMsg(DBGMSG.TOUCH, 'touch move touches.length='+ touches.length);
      return;  // 2本指以上の操作の場合は処理しない
    }
    e.data.move(touches[0].pageY);
  }
});

// 操作クラス (BtnBaseが所有) /////////
// クリック操作クラス
// id:ボタンID
// fnClick:クリック関数
var ActClick = function (id, fnClick)
{
  this.id = id;
  this.fnClick = fnClick;
  
  this.b_no_click = false;    // クリック処理無効フラグ
  this.b_disable = false;
}
ActClick.prototype = {
  Trans: function (b_trans) {},  // 通信
  Down : function () {},  // ダウン
  Up   : function () {},  // アップ
  // クリック
  Click : function() {
    if (this.b_no_click == true) {
      // クリック無効フラグがある場合は実行しない
      DebugMsg(DBGMSG.UI, 'ActClick No Click');
      this.b_no_click = false;
      return;
    }
    DebugMsg(DBGMSG.UI, 'ActClick Click');
    this.fnClick();
  },
  // 許可/禁止
  Disable : function (b_disable) {
    if (b_disable !== undefined) {
      this.b_disable = b_disable;
      return true;
    } else {
      return this.b_disable;
    }
  },
  // タッチムーブ
  TouchMove : function () {
     // タッチムーブ時はクリック処理しないようフラグを立てる
    this.b_no_click = true;
  }
}
// 長押し操作クラス (ActClick継承、BtnBaseが所有)
// id:ボタンID
// fnPressing: 長押し関数
// fnClick   : クリック関数。未設定時は長押し関数をActClickに渡す
var ActHold = function (id, fnPressing, fnClick) {
  ActHold.base.apply(this, [id, fnClick ? fnClick : fnPressing]);  // 親クラスのコンストラクタ
  
  this.fnPressing = fnPressing;     // 長押し処理関数
  this.msec_start_pressing = 1000;  // 長押し処理開始時間
  this.msec_interval       = 300;   // 長押し処理間隔
  
  this.b_down  = false;
  this.b_trans = false;
  this.tm_press   = null;   // 押下処理タイマー
}.inheritance(ActClick);
$.extend(ActHold.prototype, {
  // ローカルメソッド
  // 押下中タイマー処理。タイマー内のthisはWindowオブジェクトになるため変数にthisを入れて渡す
  // msec : setTimeout間隔
  pressing : function (msec) {
    DebugMsg(DBGMSG.LONGTOUCH, 'ActHold pressing');
    // 禁止時は終了
    if (this.b_disable) {
      this.tm_press = null;
      return;
    }
    var self = this;
    this.tm_press = setTimeout(function () {
      // 押下中処理
      DebugMsg(DBGMSG.LONGTOUCH, 'ActHold do_pressing');
      // 押下中処理実行(通信中は処理しない)
      if (self.b_trans == false)
        self.fnPressing();
      
      if (self.b_down) {
        // ボタン押下時はタイマーを再設定する
        self.b_no_click = true;  // 長押し時はボタン開放でクリック処理しないようフラグを立てる
        self.tm_press = self.pressing(self.msec_interval);
      } else {
        // ボタン開放時、タイマーは再設定しない
        self.tm_press = null;
      }
    }, msec);
  },
  // 外部呼出しメソッド
  // 通信
  Trans: function (b_trans) {
    this.b_trans = b_trans;
  },
  // ダウン
  Down : function () {
    DebugMsg(DBGMSG.UI, 'ActHold Down');
    this.b_down = true;
    this.pressing(this.msec_start_pressing);  // 押下中タイマー作成
  },
  // アップ
  Up : function () {
    DebugMsg(DBGMSG.UI, 'ActHold Up');
    this.b_down = false;
    if (this.tm_press) {
      clearTimeout(this.tm_press);  // 押下中タイマー消去
      this.tm_press = null;
    }
  },
  // タッチムーブ
  TouchMove : function () {
    ActHold.parent.TouchMove.apply(this)  // 親クラス実行
    // 長押しタイマー消去
    clearTimeout(this.tm_press);
    this.tm_press = null;
  }
});
// 通信中アイコン表示クラス
var TransIcon = function (opt)
{
  this.id = s_trans_icon_id;
  if (opt && opt.id)
    this.id = opt.id;
  this.tm = null;
}
// 通信中アイコン表示メソッド
TransIcon.prototype = {
  // 表示/消去
  Display : function (b_trans) {
    if (b_trans) {
      $(this.id)[0].style.display = 'inline';  // 通信中アイコン表示
      var self = this;
      this.tm = setTimeout(function(){ self.Display(false); }, 5000)  // タイムアウト設定(5秒)
    } else {
      $(this.id)[0].style.display = 'none';  // 通信中アイコン消去
      clearTimeout(this.tm);                 // タイムアウト設定解除
    }
  }
}

// 文字整形クラス
var OverflowString = function (id, opt) {
  this.id = id;
  
  // フォント情報
  this.font = {
    weight: $(id).css('font-weight'),
    size  : PxToN(id, 'font-size'),
    ls    : PxToN(id, 'letter-spacing')
  }
  if (!this.font.ls)
    this.font.ls = 0;
  
  this.font.trim_size = this.font.size;
  this.max_width = PxToN(id, 'width') * 0.9;  // 最大幅。マージンを持たせるため*0.9する
  this.measure_id = s_dummy_span_id;  // 長さ計測に使用するタグID
  this.min_px = 0;
  
  // テキスト設定
  this.b_input = ($(id)[0].value !== undefined) ? true : false;
  if (this.b_input) {
    this.text = $(id)[0].value;
  } else {
    this.text = $(id)[0].innerHTML;
  }
  
  if (opt) {
    if (opt.max_width)  // 最大幅。マージンは自力で
      this.max_width = opt.max_width;
    if (opt.min_px)
      this.min_px = opt.min_px;
  }
  this.Text();  // 初期化
}
OverflowString.prototype = {
  // テキスト縮小フォントサイズ設定
  downSize : function (text) {
    if (text == '')
      return;
    // テキストの長さが最大長以下になるまで小さくする
    var trim_size = this.font.size;
    for (; trim_size > this.min_px; trim_size--) {
       // 文字はみ出し確認
      $(this.measure_id).css('font-size' , trim_size + 'px');
      if ($(this.measure_id)[0].offsetWidth <= this.max_width)
        break;
    }
    DebugMsg(DBGMSG.LANGOVER, 'downSize '+ this.font.size +'→'+ trim_size);
    
    return trim_size;
  },
  
  // テキスト設定
  Text : function(text) {
    // 引数あり:引数の内容を整形する、引数無し:保存内容を整形する
    if (text !== undefined)
      this.text = text;
    
    var new_text = this.text;
    $(this.measure_id).css('font-weight'   , this.font.weight)
                      .css('font-size'     , this.font.size +'px')
                      .css('letter-spacing', this.font.ls   +'px');
    
    $(this.measure_id)[0].innerHTML = new_text;
    
    DebugMsg(DBGMSG.LANGOVER, 'Overflow Text='+ new_text +' (new:'+ $(this.measure_id)[0].offsetWidth +' max:'+ this.max_width +')');
    DebugMsg(DBGMSG.LANGOVER, 'font weight='+ this.font.weight +' size='+  this.font.size +'px ls='+ this.font.ls   +'px');
    
    // はみ出しチェック
    var font_size;
    if ($(this.measure_id)[0].offsetWidth > this.max_width) {
      font_size = this.downSize(new_text);  // はみ出ている場合は縮小表示
    } else {
      font_size = this.font.size;
    }
    // フォントサイズ設定
    $(this.id).css('font-size' , font_size + 'px');
    this.font.trim_size = font_size;

    // テキスト設定(widthを決めてあれば改行は自動で行う)
    if (this.b_input) {
      $(this.id)[0].value = new_text;  // inputタグ
    } else {
      $(this.id)[0].innerHTML = new_text;  // divやlabelタグ等
    }
  },
  // 整形後のフォントサイズ
  FontSize : function () {
    return this.font.trim_size;
  }
}
// キー操作クラス
var KeyControl = function (id, fnKey) {
  this.id = id;
  this.fnKey = fnKey;
  
  $(document).on('keydown', id, this, this.evKeyDown);  // キーダウン
}
KeyControl.prototype = {
  // キーダウン処理
  keyDown : function (e) {
    var key_name = '';
    if      (e.keyCode == 37) key_name = 'left';   // ←
    else if (e.keyCode == 38) key_name = 'up';     // ↑
    else if (e.keyCode == 39) key_name = 'right';  // →
    else if (e.keyCode == 40) key_name = 'down';   // ↓
    else if (65 <= e.keyCode && e.keyCode <=  90) key_name = String.fromCharCode(e.keyCode).toLowerCase();  // 英字
    else if (48 <= e.keyCode && e.keyCode <=  57) key_name = 'n'+ String.fromCharCode(e.keyCode);           // 数字
    else if (96 <= e.keyCode && e.keyCode <= 105) key_name = 'n'+ String.fromCharCode(e.keyCode - 48);      // 10キー
    
    if (e.ctrlKey)
      key_name += '_ctrl';
    
    DebugMsg(DBGMSG.KEY, 'keyDown keyCode='+ e.keyCode +' key_name='+ key_name);
    
    // 関数実行時はfalseを返しブラウザでキーが効かないようにする
    if (this.fnKey[key_name]) {
      this.fnKey[key_name]();
      return false;
    } else {
      return true;
    }
  },
  // キーダウンイベント
  evKeyDown : function (e) {
    return e.data.keyDown(e);
  }
}

// 基本メニュークラス
var Menu = function (id, opt) {
  this.id = id;
  
  // イベント設定
  if (s_bEnableTouch) {
    // タッチパネル
    $(document).on('touchstart', id, this, this.evDown);    // タッチ開始
    $(document).on('touchend', id, this, this.evUp);        // タッチ終了
    $(document).on('touchend', id, this, this.evClick);     // クリックと同等。evUpの後にevClickを実行するよう登録
    $(document).on('touchmove', id, this, this.evTouchMove) // タッチムーブ
  } else {
    // PC
    $(document).on('mousedown', id, this, this.evDown);        // マウスダウン
    $(document).on('mouseup', this, this.evUp);                // マウスアップ
    $(document).on('click', id, this, this.evClick);           // クリック
    $(document).on('mouseover', id, this, this.evMouseOver);   // マウスオーバー
    $(document).on('mouseout', id, this, this.evMouseOut);     // マウスアウト
  }
  $(document).on('focus', id, this, this.evDown);   // フォーカス(ダウンと同等)
  $(document).on('blur' , id, this, this.evUp);    // フォーカスアウト(アップと同等)
  // 変数設定
  this.b_down = false;  // マウスダウン/タッチスタートフラグ
  this.b_over = false;  // マウスオーバーフラグ
  this.b_disable = false;  // 禁止状態フラグ
  this.tm_touch_move = null;  // タッチムーブタイマー
  
  // 定数設定
  this.txt_color_normal = $(id).css('color');  // 通常時の文字色保存
  this.color = {  // メニュー色
    normal: $(this.id).css('background-color'),
    down  : '#3073BF'
  };
  this.color.over    = this.color.down;
  this.color.disable = this.color.normal;
  
  // 拡張設定
  if (opt) {
    if (opt.click){
      this.fnClick = opt.click;
    }
    if (opt.color) {  // 背景色設定
      if (opt.color.normal ){ this.color.normal  = opt.color.normal; }
      if (opt.color.down   ){ this.color.down    = opt.color.down; }
      if (opt.color.over   ){ this.color.over    = opt.color.over; }
      if (opt.color.disable){ this.color.disable = opt.color.disable; }
    }
    if (opt.txt) {  // 文字設定
      this.txt = new Label(opt.txt.id);
    }
    if (opt.sts) {  // 右側文字(「>」やステータスなど)設定
      this.sts = new Label(opt.sts.id);
    }
  }
  // 初期化
  this.SetStatus(true);
}
// メニューメソッド
Menu.prototype = {
  // ローカルメソッド
  // 背景色設定
  changeColor : function () {
    DebugMsg(DBGMSG.UI, 'menu changeColor');
    var color = '';
    if (this.b_disable){
      color = this.color.disable;
    }else if (this.b_down){
      color = this.color.down;
    }else if (this.b_over){
      color = this.color.over;
    }else{
      color = this.color.normal;
    }
    $(this.id)[0].style.backgroundColor = color;  //iOS8ではこの一撃でfixedが戻る
  },
  // マウスダウン/タッチ開始処理
  down : function () {
    if (this.b_down == true || this.b_disable == true){
      return false;  // 押下、禁止時は処理しない
    }
    DebugMsg(DBGMSG.UI, 'menu down');
    this.b_down = true;
    this.changeColor();	
    return true;
  },
  // マウスアップ/タッチ終了処理
  up : function () {
    if (this.b_down == false || this.b_disable == true){
      return false;  // 開放、禁止時は処理しない
    }
    DebugMsg(DBGMSG.UI, 'menu up');
    this.b_down = false;
    this.changeColor();
    return true;
  },
  // クリック処理
  click : function() {
    if (this.tm_touch_move) {
      // タッチムーブ時は処理しない
      clearTimeout(this.tm_touch_move);  // タイマーを解除
      this.tm_touch_move = null;
      return false;
    }
    DebugMsg(DBGMSG.UI, 'menu click touch_move=' +this.tm_touch_move);
    if (this.fnClick){
      this.fnClick();
    }
    return true;
  },
  // マウスオーバー処理
  mouseOver : function () {
    DebugMsg(DBGMSG.UI, 'over');
    this.b_over = true;
    this.changeColor();
    if (this.b_disable == false)
      $(this.id)[0].style.cursor = 'pointer';  // マウスカーソル
  },
  // マウスアウト処理
  mouseOut : function () {
    DebugMsg(DBGMSG.UI, 'out');
    this.b_over = false;
    this.changeColor();
    $(this.id)[0].style.cursor = 'arrow';  // マウスカーソル
  },
  // タッチムーブ処理
  // 引数 self : BaseMenu自身。setTimeout関数内のthisは別物なので引数で渡す
  touchMove : function () {
    // 通常のブラウザはtouchstartでフラグを変えてtouchendでフラグを戻すことができるが、
    // touchmove発生後touchendイベントを行わないブラウザ(ASUSなど一部のAndroid)があるので、フラグを戻せなくなる。
    // ボタンでの実装のように、touchstartイベントでpreventDefaultを呼べばtouchendは必ず発生するが、touchmoveが発生しなくなる。
    // ボタンと同等の実装ではメニューに触るとスクロールできなくなるので、preventDefaultではなくtouchmove発生後にタイマーでtouchendと同等の処理を呼ぶことにした
    if (this.tm_touch_move) {
      clearTimeout(this.tm_touch_move);  // タイマー設定時はリセット後に再設定
    } else {
      DebugMsg(DBGMSG.UI, 'touchMove start');
    }
    // タッチムーブ終了設定。500ms後にupを呼び出す。
    var self = this;
    this.tm_touch_move = setTimeout(function () {
      DebugMsg(DBGMSG.UI, 'touchMoveEnd');
      self.tm_touch_move = null;
      self.up();
    }, 500);
  },
  // イベント
  evClick     : function (e) { e.data.click();     },  // クリックイベント
  evDown      : function (e) { e.data.down(); e.stopPropagation();},  // マウスダウンイベント(画面が切り替わる場合stopPropagationで次の画面にタッチイベントを送らないようにする)
  evUp        : function (e) { e.data.up();        },  // マウスアップイベント
  evTouchMove : function (e) { e.data.touchMove(); },  // タッチムーブイベント
  evMouseOut  : function (e) { e.data.mouseOut();  },  // マウスアウトイベント
  evMouseOver : function (e) { e.data.mouseOver(); },  // マウスオーバーイベント
  // 外部呼出しメソッド
  // 許可状態設定
  SetStatus : function (b_enable) {
    // フラグ設定
    this.b_disable = !b_enable;
    
    // 表示変更
    this.changeColor();   // 色
    if (this.txt)
      this.txt.SetEnable(b_enable);
    if (this.sts)
      this.sts.SetEnable(b_enable);
  },
  GetID      : function() { return this.id; }  // ID取得
};

// スライダークラス /////////
var Slider;
// 基本スライダークラス
var SldBase = function (id, p_id, fnMove, opt) {
  // ID設定
  this.id = id;
  this.fnMove = fnMove;  // スライダー移動時の処理関数
  
  // 変数初期化
  // フラグ
  this.b_down = false;
  this.b_disable = false;
  this.b_trans = false;
  
  // スライダー本体
  this.left = PxToN(id, 'left'),
  this.top  = PxToN(id, 'top' )
  this.w    = PxToN(id, 'width'),
  this.h    = PxToN(id, 'height')
  // ポインタクラス
  this.ptr = new SldPointer2D(p_id, id, opt.ptr);
  // 通信アイコンクラス
  this.transIcon = new TransIcon();
  
  // 拡張設定
  if (opt) {
    if (opt.back_img) {
      this.back_img = opt.back_img;  // 背景画像
      this.background_size  = $(id).css('background-size');  // ボタン画像サイズ
    }
  }
}
// 基本スライダーメソッド
SldBase.prototype = {
  // 画像変更
  changeImg : function() {
    // 背景変更
    if (this.back_img) {
      var path;
      if (this.b_disable) path = this.back_img.disable;  // 禁止時
      else                path = this.back_img.normal;   // 通常時
      
      $(this.id)[0].style.background     = 'url('+ path +')';
      $(this.id)[0].style.backgroundSize = this.background_size;
    }
  },
  
  // ダウン処理
  down : function (page_pos) {
    if (this.b_down || this.b_disable)
      return false;  // 押下、禁止時は処理しない
    DebugMsg(DBGMSG.UI, 'sld down page x='+ page_pos.x +'y='+ page_pos.y);
    
    this.b_down = true;
    this.move(page_pos);  // ダウン位置へポインタを移動する
    
    return true;
  },
  // アップ処理
  up : function () {
    if (!this.b_down || this.b_disable)
      return false;  // 開放、禁止時は処理しない
    DebugMsg(DBGMSG.UI, 'sld up');
    
    this.b_down = false;
    
    return true;
  },
  // 移動処理
  move : function (page_pos) {
    if (this.b_down == false)
      return false;
    
    // ポインタ移動処理
    if (s_bAndroid == false) {
      // PC/iOS
      DebugMsg(DBGMSG.SLIDER, 'sld move');
      this.ptr.Position(page_pos);
      this.fnMove();
    } else {
      // Androidは処理に時間がかかるためタイマーで移動を行う
      if (this.tm_move)
        return false;  // タイマー動作中は処理しない
      
      var self = this;
      this.tm_move = setTimeout(function () {
        //DebugMsg(DBGMSG.SLIDER, 'page_pos='+ JSON.stringify(page_pos));
        // ポインタ移動処理
        self.ptr.Position(page_pos);
        self.fnMove();
        self.tm_move = null;
      }, 100);
    }
  },
  // 通信中設定。コマンド通信時はボタン処理不可
  // b_trans : true=通信開始, false=通信終了
  Trans : function (b_trans) {
    DebugMsg(DBGMSG.SLIDER, 'sld Trans b_trans='+ b_trans);
    if (b_trans == this.b_trans)
      return;
    this.b_trans = b_trans;
    this.ptr.Trans(b_trans);  // 通信中操作(フラグを立てる)
    this.transIcon.Display(b_trans);  // 通信アイコン表示/消去
  },
  // 値設定/取得
  Value : function (val, b_move) {
    if (val !== undefined) {
      // 設定
      DebugMsg(DBGMSG.UI, 'Value val='+ JSON.stringify(val) +' b_down='+ this.b_down +' b_trans='+ this.b_trans);
      if (this.b_down && this.b_trans)
        return false;
      var ret = this.ptr.Value(val);
      if (ret && b_move && this.tm_move == null)
        this.fnMove();
      return ret;
    } else {
      // 取得
      return this.ptr.Value();
    }
  },
  // 操作可不可設定
  SetEnable : function (b_enable) {
    this.b_disable = !b_enable;
    this.changeImg();  // 画像変更
    
    this.ptr.SetEnable(b_enable);
  },
  // 最大値設定
  Max : function (max) {
    this.ptr.Max(max);
  }
}
// スライダーマウスクラス
SldMouse = function (id, p_id, fnMove, opt) {
  SldMouse.base.apply(this, arguments);  // 親クラスのコンストラクタ
  
  $(document).on('mousedown', id, this, this.evDown);       // マウスダウン
  $(document).on('mouseup', this, this.evUp);  // マウスアップ。IDを指定せずウィンドウ全体でイベントを取得
  $(document).on('mousemove', this, this.evMove);
}.inheritance(SldBase);
// スライダーマウスメソッド
$.extend(SldMouse.prototype, {
  // イベント
  // マウスダウンイベント
  evDown : function (e) {
    var page_pos = {x: e.pageX, y: e.pageY};
    e.data.down(page_pos);
  },
  // マウスアップイベント
  evUp : function (e) {
    e.data.up();
  },
  // マウスムーブイベント
  evMove : function (e) {
    var page_pos = {x: e.pageX, y: e.pageY};
    //DebugMsg(DBGMSG.SLIDER, 'sld mouse move='+ page_pos.x +','+ page_pos.y, true);
    e.data.move(page_pos);
  }
});
// スライダータッチクラス
SldTouch = function (id, p_id, fnMove, opt) {
  SldTouch.base.apply(this, arguments);  // 親クラスのコンストラクタ
  // イベント設定
  $(document).on('touchstart', id, this, this.evDown);       // マウスダウン
  $(document).on('touchend', id, this, this.evUp);  // マウスアップ。
  $(document).on('touchmove', id, this, this.evMove);
  
  // 回転イベント設定
  if (g_ev_rotation) {
//    $(window).on(g_ev_rotation, this, this.evRotation);
//    this.rotation(); // クラス作成時に呼び出す
  }
}.inheritance(SldBase);
// スライダータッチメソッド
$.extend(SldTouch.prototype, {
  // 回転処理
  rotation : function () {
    DebugMsg(DBGMSG.UI, 'sld rotation start 1/zoom_factor='+ 1 / s_zoom.factor);
    // 回転時にページ全体を倍率調整している関係上スライダー位置がずれるため、倍率サイズと逆数をかけ中央に表示する。
//    $(this.id)[0].style.left = parseInt(this.left + (s_zoom.factor - 1)*this.w/2) +'px';
//    $(this.id)[0].style.top  = parseInt(this.top  + (s_zoom.factor - 1)*this.h/2) +'px';
//    $(this.id)[0].style.zoom = 1 / s_zoom.factor;
  },
  // イベント
  // タッチ開始イベント
  evDown : function (e) {
    e.preventDefault();
    var touches = e.originalEvent.touches;
    if (touches.length >= 2) {
      DebugMsg(DBGMSG.UI, 'sld touch start touches.length='+ touches.length);
      return;  // 2本指以上の操作の場合は処理しない
    }
    var page_pos = {x: touches[0].pageX, y: touches[0].pageY};
    e.data.down(page_pos);
  },
  // タッチ終了イベント
  evUp : function (e) {
    e.data.up();
  },
  // タッチムーブイベント
  evMove : function (e) {
    var touches = e.originalEvent.touches;
    if (touches.length >= 2)
      return;
    var page_pos = {x: touches[0].pageX, y: touches[0].pageY};
    e.data.move(page_pos);
  },
  // 回転イベント
  evRotation : function (e) {
    DebugMsg(DBGMSG.UI, 'evRotation');
//    e.data.rotation();
  }
});

// 2次元スライダーポインタクラス
SldPointer2D = function (id, sld_id, opt) {
  // 引数設定
  this.id = id;
  this.sld = {
    id: sld_id
  };
  // イベント設定
  $(document).on('focus', id, this, this.evFocus);   // フォーカス
  $(document).on('blur' , id, this, this.evBlur);    // フォーカスアウト
  
  // 変数設定
  this.val  = {x:  0, y:  0};  // 現在値
  this.min  = {x:  0, y:  0};  // 最小値
  this.max  = {x:499, y:499};  // 最大値
  //this.step = {x:  1, y: 20};  // ステップ
  // 定数設定
  this.left = PxToN(id, 'left'  );  // ポインタ横位置
  this.top  = PxToN(id, 'top'   );  // ポインタ縦位置
  this.w    = PxToN(id, 'width' );  // ポインタ幅
  this.h    = PxToN(id, 'height');  // ポインタ高
  
  this.sld.w = PxToN(sld_id, 'width' );  // スライダー幅
  this.sld.h = PxToN(sld_id, 'height');  // スライダー高
  
  this.shadow = {  // ボタン影
    focus: s_shadow.focus +' inset',  // フォーカス
    trans: s_shadow.trans +' inset',  // 通信中
    none : ''               // なし
  }
  
  // 任意設定
  if (opt) {
    if (opt.min) {
      if (opt.min.x) this.min.x = opt.min.x;
      if (opt.min.y) this.min.y = opt.min.y;
    }
    if (opt.max) {
      if (opt.max.x) this.max.x = opt.max.x;
      if (opt.max.y) this.max.y = opt.max.y;
    }
    if (opt.key)  // キー設定時
      this.key = new KeyControl(id, opt.key);
    //if (opt.step) {
    //  if (opt.step.x) this.step.x = opt.step.x;
    //  if (opt.step.y) this.step.y = opt.step.y;
    //}
  }
}
// 2次元スライダーポインタメソッド
SldPointer2D.prototype = {
  // ボタン影変更
  changeShadow : function() {
    var shadow;
    if (this.b_disable)    shadow = this.shadow.none;   // 禁止時(消去)
    else if (this.b_trans) shadow = this.shadow.trans;  // 通信表示
    else if (this.b_focus) shadow = this.shadow.focus;  // フォーカス表示
    else                   shadow = this.shadow.none;   // フォーカスアウト(消去)
    
    $(this.id)[0].style.boxShadow       = shadow;
    $(this.id)[0].style.WebkitBoxShadow = shadow;
  },
  // フォーカス処理
  focus : function () {
    this.b_focus = true;
    this.changeShadow()  // ボタン影フォーカス
  },
  // フォーカスアウト処理
  blur : function () {
    this.b_focus = false;
    this.changeShadow()  // ボタン影削除
  },
  // オフセット位置計算
  offset : function (page_pos) {
    var sld_ofs = $(this.sld.id).offset()
    ofs = {
      left: page_pos.x - parseInt(sld_ofs.left + this.w/2),
      top : page_pos.y - parseInt(sld_ofs.top  + this.h/2)
    }
    return ofs;
  },
  // オフセット位置と値の関係は  (オフセット位置)：(現在値-最小値) = (スライダー移動幅)：(最大最小幅)
  // 位置→値変換
  offsetToValue : function (ofs) {
    // スライダー、最大最小幅を計算
    var len_sld = { w : this.sld.w - this.w    , h : this.sld.h - this.h     };
    var len_val = { x : this.max.x - this.min.x, y : this.max.y - this.min.y };
    
    // 次の計算式により算出。left : (x - min) = len_sld : len_val -> x = left * len_val / len_sld + min
    var val = {
      x : parseInt( ofs.left             * len_val.x / len_sld.w) + this.min.x,
      y : parseInt((len_sld.h - ofs.top) * len_val.y / len_sld.h) + this.min.y   // y方向を逆転させるため(len_sld.h - ofs.top)
    }
    DebugMsg(DBGMSG.SLIDER, 'offsetToValue ofs='+ JSON.stringify(ofs));
    DebugMsg(DBGMSG.SLIDER, 'val='+ JSON.stringify(val));
    return val;
  },
  // 値→位置変換
  valueToOffset : function (val) {
    // スライダー、最大最小幅を計算
    var len_sld = { w : this.sld.w - this.w    , h : this.sld.h - this.h     };
    var len_val = { x : this.max.x - this.min.x, y : this.max.y - this.min.y };
    
    // 次の計算式により算出。left : (x - min) = len_sld : len_val -> left = (x - min) * len_sld / len_val
    var ofs = {
      left: parseInt(             (val.x - this.min.x)  * len_sld.w / len_val.x),
      top : parseInt((len_val.y - (val.y - this.min.y)) * len_sld.h / len_val.y)   // y方向を逆転させるため(len_val.y - (val.y - this.min.y))
    }
    DebugMsg(DBGMSG.SLIDER, 'valueToOffset val='+ JSON.stringify(val));
    DebugMsg(DBGMSG.SLIDER, 'ofs='+ JSON.stringify(ofs));
    return ofs;
  },
  // ポインタがスライダーからはみ出ないよう調整
  adjOffset : function (ofs) {
    if (ofs.left < 0) ofs.left = 0;
    if (ofs.top  < 0) ofs.top  = 0;
    if (ofs.left > this.sld.w - this.w) ofs.left = this.sld.w - this.w;
    if (ofs.top  > this.sld.h - this.h) ofs.top  = this.sld.h - this.h;
    
    return ofs;
  },
  // マウス/タッチ位置がスライダ内か確認
  IsInSlider : function (page_pos) {
    var ofs = this.offset(page_pos);
    if (0 <= ofs.left + this.w/2 && ofs.left + this.w/2 < this.sld.w
     && 0 <= ofs.top  + this.h/2 && ofs.top  + this.h/2 < this.sld.h) {
      return true;
    } else {
      DebugMsg(DBGMSG.UI, 'IsInSlider ret=false');
      return false;
    }
  },
  // ポインタ位置設定/取得
  Position : function (page_pos) {
    if (page_pos !== undefined) {
      //DebugMsg(DBGMSG.SLIDER, 'ptr Position');
      // 位置設定
      var ofs = this.offset(page_pos);
      // ポインタがスライダーからはみ出ないよう調整
      if (ofs.left < 0) ofs.left = 0;
      if (ofs.top  < 0) ofs.top  = 0;
      if (ofs.left > this.sld.w - this.w) ofs.left = this.sld.w - this.w;
      if (ofs.top  > this.sld.h - this.h) ofs.top  = this.sld.h - this.h;
      
      if (ofs.left == PxToN(this.id, 'left') && ofs.top == PxToN(this.id, 'top'))
        return false;  // 同じ場合は設定しない
      
      // 位置設定
      $(this.id)[0].style.left = parseInt(ofs.left) +'px';
      $(this.id)[0].style.top  = parseInt(ofs.top ) +'px';
      // 値設定
      this.val = this.offsetToValue(ofs);
      return true;
    } else {
      // 位置取得
      return {left: PxToN(this.id, 'left'), top: PxToN(this.id, 'top')};
    }
  },
  // 値設定/取得
  Value : function (val) {
    if (val !== undefined) {
      DebugMsg(DBGMSG.UI, 'ptr Value val='+val.x+','+val.y+' this.val='+ this.val.x+','+this.val.y);
      // 値が最大最小からはみ出ないよう調整
      if (val.x < this.min.x) val.x = this.min.x;
      if (val.y < this.min.y) val.y = this.min.y;
      if (val.x > this.max.x) val.x = this.max.x;
      if (val.y > this.max.y) val.y = this.max.y;
      
      if (val.x == this.val.x && val.y == this.val.y)
        return false;  // 同じ場合は設定しない
      
      // 値設定
      this.val = val;
      // 位置設定
      var ofs = this.valueToOffset(val);
      ofs = this.adjOffset(ofs);
      DebugMsg(DBGMSG.UI, 'ptr ofs='+ofs.left+','+ofs.top);
      $(this.id)[0].style.left = parseInt(ofs.left) +'px';
      $(this.id)[0].style.top  = parseInt(ofs.top ) +'px';
      
      return true;
    } else {
      // 値取得
      return this.val;
    }
  },
  // 通信中設定。コマンド通信時はボタン処理不可
  // b_trans : true=通信開始, false=通信終了
  Trans : function (b_trans) {
    this.b_trans = b_trans;
    this.changeShadow();  // ボタン影変更
  },
  // 最小値設定
  Min : function (min) { this.min = min; },
  // 最大値設定
  Max : function (max) { this.max = max; },
  // 操作可不可設定
  SetEnable : function (b_enable) {
    $(this.id)[0].style.visibility = b_enable ? 'visible' : 'hidden';
  },
  // イベント
  evFocus: function (e) { e.data.focus(); },  // フォーカスイベント
  evBlur : function (e) { e.data.blur();  }  // フォーカスアウトイベント
/*  // 値が最大最小からはみ出ないよう調整
  adjValue : function (val) {
    if (val.x < this.min.x) val.x = this.min.x;
    if (val.y < this.min.y) val.y = this.min.y;
    if (val.x > this.max.x) val.x = this.max.x;
    if (val.y > this.max.y) val.y = this.max.y;
    
    return val;
  },
  // マウス/タッチ位置がポインタ内か確認
  IsInPointer : function (page_pos) {
    var ofs = this.offset(page_pos);
    if ((this.left <= ofs.left && ofs.left <= this.left + this.w)
     && (this.top  <= ofs.top  && ofs.top  <= this.top  + this.h)) {
      DebugMsg(DBGMSG.UI, 'IsInPointer ret=true');
      return true;
    } else {
      DebugMsg(DBGMSG.UI, 'IsInPointer ret=false');
      return false;
    }
  },
*/
}

// ラベルクラス
var Label = function (id, opt) {
  this.id = id;
  this.color = {
    normal : $(id).css('color'),
    disable: 'gray'
  }
  this.b_disable = false;
  
  if (opt) {
    if (opt.overflow) this.overflow = new OverflowString(id, opt.overflow);
  }
}
Label.prototype = {
  // テキスト取得
  GetText : function () {
    return $(this.id)[0].innerHTML;
  },
  // テキスト設定
  SetText : function(text) {
    if (this.overflow) {
      // 文字整形あり
      this.overflow.Text(text);
    } else {
      // 文字整形なし
      $(this.id)[0].innerHTML = text;
    }
  },
  // 禁止/許可表示
  SetEnable : function (b_enable) {
    if (this.b_disable != b_enable)
      return;  // 変更が無い場合は処理しない
    this.b_disable = !b_enable;
    $(this.id)[0].style.color  = b_enable ? this.color.normal : this.color.disable;
  }
}
// テキスト入力クラス
var TextInput = function (id, opt) {
  this.id = id;
  this.b_focus = false;
  
  $(document).on('focus', id, this, this.evFocus);  // フォーカス
  $(document).on('blur' , id, this, this.evBlur);   // フォーカスアウト
  
  if (opt) {
    if (opt.fixed) {
      this.fixed_id = '';
      for (var i = 0; i < opt.fixed.length; i++) {
        if (i > 0)
          this.fixed_id += ', ';
        this.fixed_id += opt.fixed[i];
      }
    }
  }
}
// テキスト入力メソッド
TextInput.prototype = {
  // フォーカス処理
  focus : function () {
    if (this.b_focus == true)
      return;
    this.b_focus = true;
//    if (s_bEnableTouch == true && s_bAndroid == false) {
    if (s_bEnableTouch == true) {
      // iOSのキーボード表示によるfixed不具合対策。フォーカスが当たりキーボードが出たら位置固定解除
      DebugMsg(DBGMSG.UI, 'TextInput focus');
      $('div.head').css('position', 'relative');
      if (this.fixed_id)
        $(this.fixed_id).css('position', 'absolute');
    }
  },
  // フォーカスアウト処理
  blur : function () {
    if (this.b_focus == false)
      return;
    this.b_focus = false;
//    if (s_bEnableTouch == true && s_bAndroid == false) {
    if (s_bEnableTouch == true) {
      // キーボードを閉じたらフォーカスアウトが発生するので、再び位置を固定
      $('div.head').css('position', 'fixed');
      if (this.fixed_id)
        $(this.fixed_id).css('position', 'fixed');
      DebugMsg(DBGMSG.UI, 'TextInput blur');
    }
  },
  // フォーカス設定
  SetFocus : function (b_focus) {
    // iPadでfocus/blurを実行してもイベントが発生しないため、Disable時は自力で呼び出す
    if (b_focus) {
      $(this.id)[0].focus();
      this.focus();
    } else {
      $(this.id)[0].blur();
      this.blur();
    }
  },
  // イベント
  evFocus: function (e) { e.data.focus(); },  // フォーカスイベント
  evBlur : function (e) { e.data.blur();  }   // フォーカスアウトイベント
}
// ダイアログクラス
var Dialog = function (id) {
  this.id = id;
  // 変数初期化
  this.b_down = false;
  // 定数設定
  this.l = PxToN(id, 'left'  );  // 横位置
  this.t = PxToN(id, 'top'   );  // 縦位置
  this.w = PxToN(id, 'width' );  // 幅
  this.h = PxToN(id, 'height');  // 高
  // イベント設定
  if (s_bEnableTouch) {
    $(document).on('touchstart', id, this, this.evTouchDown); // マウスダウン
    $(document).on('touchend', id, this, this.evTouchUp);     // マウスアップ。
    $(document).on('touchmove', id, this, this.evTouchMove);
  } else {
    $(document).on('mousedown', id, this, this.evMouseDown);  // マウスダウン
    $(document).on('mouseup', this, this.evMouseUp);          // マウスアップ。IDを指定せずウィンドウ全体でイベントを取得
    $(document).on('mousemove', this, this.evMouseMove);
    $(document).on('dblclick', this, this.evDblClick);
  }
};
Dialog.prototype = {
  // ポジション取得
  get_pos : function (e) {
    var touches = e.originalEvent.touches;
    var ar = [];
    for (var i = 0; i < touches.length; i++)
      ar[i] = {x: Math.ceil(touches[i].pageX/s_zoom.factor), y: Math.ceil(touches[i].pageY/s_zoom.factor)}
    return ar;
  },
  // ダウン処理
  down : function (page_pos) {
    if (this.b_down)
      return false;  // 押下時は処理しない
    this.b_down = true;
    return true;
  },
  // アップ処理
  up : function () {
    this.b_down = false;
  },
  // 移動処理
  move : function (page_pos) {
    if (!this.b_down)
      return false;
    return true;
  },
  gesturestart  : function (zoom_pos) {},
  gesturechange : function (zoom_pos) {},
  gestureend    : function () {},
  dblclick      : function () {},
  // イベント
  // タッチ開始イベント
  evTouchDown : function (e) {
    e.preventDefault();
    var pos = e.data.get_pos(e);
    if (pos.length >= 2) {  // 2本指操作
      e.data.gesturestart(pos);
    } else if (pos.length == 1) {
      e.data.down(pos[0]);
    }
  },
  // タッチ終了イベント
  evTouchUp : function (e) {
    var pos = e.data.get_pos(e);
    if (pos.length >= 1) {  // 2本指操作
      e.data.gestureend();
    } else if (pos.length == 0) {
      e.data.up();
    }
  },
  // タッチムーブイベント
  evTouchMove : function (e) {
    var pos = e.data.get_pos(e);
    if (pos.length >= 2) {
      e.data.gesturechange(pos);
    } else if (pos.length == 1) {
      e.data.move(pos[0]);
    }
  },
  // マウスダウンイベント
  evMouseDown : function (e) { e.data.down({x: e.pageX, y: e.pageY}); },
  // マウスアップイベント
  evMouseUp : function (e)   { e.data.up(); },
  // マウスムーブイベント
  evMouseMove : function (e) { e.data.move({x: e.pageX, y: e.pageY}); },
  // マウスダブルクリックイベント
  evDblClick : function (e) { e.data.dblclick({x: e.pageX, y: e.pageY}); }
}
// デバッグダイアログクラス
var DebugDlg = function (id, level) {
  DebugDlg.base.apply(this, arguments);  // 親クラスのコンストラクタ
  
  this.level = level;
  // 変数初期化
  this.down_pos = {x:0, y:0};
  this.zs = {l:0, t:0, w:0, h:0};
  this.fs = PxToN(id, 'font-size');
  this.b_scroll = true;
  
  var cookie = GetCookie(id).split('&');
  if (cookie) {
    for (var i = 0; i < cookie.length; i++) {
      var val_i = cookie[i].indexOf('=');
      var key = cookie[i].substring(0, val_i);
      var val = parseInt(cookie[i].slice(val_i + 1));
      if ((key == 'w' || key == 'h') && val <= 5)
        val = this[key];  // 小さくしすぎると元に戻せないため。
      switch (key) {
        case 'l' : this.l  = $(id).css('left'     , val +'px'); break;
        case 't' : this.t  = $(id).css('top'      , val +'px'); break;
        case 'w' : this.w  = $(id).css('width'    , val +'px'); break;
        case 'h' : this.h  = $(id).css('height'   , val +'px'); break;
        case 'fs': this.fs = $(id).css('font-size', val +'px'); break;
      }
    }
  }
  this.mode_x = '';
  this.mode_y = '';
}.inheritance(Dialog);
$.extend(DebugDlg.prototype, {
  down : function (pos) {
    if (!DebugDlg.parent.down.apply(this, arguments))
      return;
    this.down_pos = pos;
    // タッチ位置により処理を変える
    var ofs = {x:pos.x - this.l, y: pos.y - this.t}
    if (ofs.x < 20) 
      this.mode_x = 'l';   // 左
    else if (ofs.x > this.w - 20)
      this.mode_x = 'r';   // 右
    if (ofs.y < 20)
      this.mode_y = 't';   // 上
    else if (ofs.y > this.h - 20)
      this.mode_y = 'b';   // 下
  },
  up : function () {
    DebugDlg.parent.up.apply(this, arguments);
    this.l = PxToN(this.id, 'left');    // 横位置
    this.t = PxToN(this.id, 'top' );    // 縦位置
    this.w = PxToN(this.id, 'width' );  // 幅
    this.h = PxToN(this.id, 'height');  // 高
    SetCookie(this.id, 'l='+this.l+'&t='+this.t+'&w='+this.w+'&h='+this.h+'&fs='+this.fs);
    this.mode_x = '';
    this.mode_y = '';
  },
  move : function (pos) {
    if (!DebugDlg.parent.move.apply(this, arguments))
      return;
    
    var diff = {x: pos.x - this.down_pos.x, y: pos.y - this.down_pos.y}
    
    if (this.mode_x || this.mode_y == 'b') {
      // 拡大縮小
      switch (this.mode_x) {
        case 'l': $(this.id).css('left' , parseInt(this.l + diff.x) +'px').css('width' , parseInt(this.w - diff.x) +'px'); break;
        case 'r': $(this.id).css('width', parseInt(this.w + diff.x) +'px'); break;
      }
      if (this.mode_y == 'b') {
        $(this.id).css('height', parseInt(this.h + diff.y) +'px');
      }
    } else if (this.mode_y == 't') {
      // 移動処理
      $(this.id).css('left', parseInt(this.l + diff.x) +'px').css('top', parseInt(this.t + diff.y) +'px');
    } else {
      // スクロール
      $(this.id).scrollLeft($(this.id).scrollLeft() - diff.x).scrollTop($(this.id).scrollTop() - diff.y);
    }
  },
  getZoom : function (pos) {
    return {l : (pos[0].x < pos[1].x) ? pos[0].x : pos[1].x,
            t : (pos[0].y < pos[1].y) ? pos[0].y : pos[1].y,
            w : Math.abs(pos[0].x - pos[1].x),
            h : Math.abs(pos[0].y - pos[1].y)};
  },
  gesturestart : function (pos) {
    if (pos.length == 3)
      this.b_scroll = !this.b_scroll;  // 3本指タッチで自動スクロールのON/OFF
    this.zs = this.getZoom(pos);
  },
  gesturechange : function (pos) {
    var zm = this.getZoom(pos);
    // フォント拡縮処理
    var diff = {w: zm.w - this.zs.w, h: zm.h - this.zs.h}
    var fs = this.fs + Math.ceil((diff.w + diff.h)/40);
    $(this.id).css('font-size', fs +'px');
    // 拡縮処理
    //var diff = {l: zm.l - this.zs.l, t: zm.t - this.zs.t,w: zm.w - this.zs.w, h: zm.h - this.zs.h}
    //$(this.id).css('left'  , parseInt(this.l + diff.l) +'px').css('top'   , parseInt(this.t + diff.t) +'px')
    //          .css('width' , parseInt(this.w + diff.w) +'px').css('height', parseInt(this.h + diff.h) +'px');
  },
  gestureend : function () {
    this.w  = PxToN(this.id, 'width' );  // 幅
    this.h  = PxToN(this.id, 'height');  // 高
    this.fs = PxToN(this.id, 'font-size');
  },
  dblclick : function (pos) {
    this.b_scroll = !this.b_scroll;  //ダブルクリックで自動スクロールのON/OFF
  },
  // デバッグテキスト書込み
  Log : function (level, str, b_clear) {
    if (this.level < level)
      return;
    if (b_clear) {
      $(this.id)[0].innerHTML = str;
    } else {
      $(this.id)[0].innerHTML += str;
      if (this.b_scroll)
        $(this.id).scrollTop($(this.id)[0].scrollHeight);  // 書込み時に自動でスクロール
    }
    $(this.id)[0].innerHTML += '<br />';
  }
});

// utility.js読込み時の初期化 /////
// 初期化
$(function()
{
  // タッチ/マウスフラグとクラス設定(デバイスによって実装するクラスを設定する)
  if ('createTouch' in document || 'ontouchstart' in document) {
    s_bEnableTouch = true;
    Button = BtnTouch;
    Slider = SldTouch;
  } else {
    s_bEnableTouch = false;
    Button = BtnMouse;
    Slider = SldMouse;
  }
  
  // GETパラメータの取得および保存
  var get_query = window.location.search.substring(1);
  var get_parms = get_query.split('&');
  for (var i = 0; i < get_parms.length; i++) {
    var pos = get_parms[i].indexOf('=');
    if (pos > 0) {
      var key = get_parms[i].substring(0, pos);
      var val = get_parms[i].substring(pos + 1);
      g_get[key] = val;
    }
  }
  
  // ユーザーエージェント取得
  g_UserAgent = window.navigator.userAgent.toLowerCase();
  
  // 機種判別。ユーザーエージェントで判別
  if (g_get['model']) {
    g_dbg_model = g_get['model'];
    if (g_dbg_model != 0) {
      g_dbg_msg = new DebugDlg('#dbg_msg', g_dbg_msg_level);
      DebugMsg(DBGMSG.INFO, g_dbg_model, true);
    }
  }
  
  
  // モバイルフラグの判別。ユーザーエージェントで判別
//  if (g_get['css'] == 'mobile') {
//    g_bMobile = true;   // Mobile
//  } else if (g_get['css'] == 'pc') {
//    g_bMobile = false;  // PC
//  } else {
//    if (g_UserAgent.indexOf('ipod')     >= 0 || g_UserAgent.indexOf('iphone') >= 0
//     || (g_UserAgent.indexOf('android') >= 0 && g_UserAgent.indexOf('mobile') >= 0)
//     || g_UserAgent.indexOf('silk')     >= 0) {
//      g_bMobile = true;   // Mobile
//    } else {
//      g_bMobile = false;  // PC
//    }
//  }
  //ウィンドウサイズで判別(cssに連動するため)
  var sW;
  sW = window.innerWidth;
  if ( sW < 600 ){
      g_bMobile = true;   // Mobile
  }else{
      g_bMobile = false;  // PC
  }
  
  // アンドロイドフラグ
  s_bAndroid = (g_UserAgent.indexOf('android') >= 0) ? true : false;
  // iOS8フラグ
  if(g_UserAgent.indexOf('mac os') >= 0){
    s_iOS8 = (g_UserAgent.indexOf('os 8_') >= 0) ? true : false;
  }
  // msg_level=(数値)追加でデバッグメッセージウィンドウ表示
  if (g_get['msg_level']) {
    g_dbg_msg_level = parseInt(g_get['msg_level']);
    if (g_dbg_msg_level > 0) {
      g_dbg_msg = new DebugDlg('#dbg_msg', g_dbg_msg_level);
      $('#dbg_msg')[0].style.visibility = 'visible';
      $('#dbg_msg')[0].style.background = 'gray';
      $('#dbg_msg')[0].style.height = g_bMobile ? '100px' : '200px';
      $('#dbg_msg')[0].style.display = 'block';
    }
  }
  DebugMsg(DBGMSG.INFO, g_UserAgent, true);
  DebugMsg(DBGMSG.UI, 'ver 1');

  DebugMsg(DBGMSG.UI, 'window width='+sW );

  // 回転イベント設定(可能なデバイスのみ)
  if (window.orientation != undefined) {
    g_ev_rotation = (s_bAndroid ? 'resize' : 'orientationchange') + ' load';
    $(window).on(g_ev_rotation, EvRotation);
  }
});
// ページ倍率設定イベント。横が長いと横回転、短いと縦回転
function EvRotation (e) {
  // キーボードが出ると一部のブラウザで縦向き時にウインドウ幅が高さより大きくなる
  // ことがあるので、幅が高さ*1.5の時に設定する
  //s_zoom.factor = $(window).width() >= $(window).height() ? s_zoom.h : s_zoom.v
//  s_zoom.factor = ($(window).width() >= $(window).height()*1.5) ? s_zoom.h : s_zoom.v;
  DebugMsg(DBGMSG.UI, 'factor='+ s_zoom.factor +' w='+ $(window).width() +' h='+ $(window).height() +' ir='+ Math.abs(window.orientation));
//  $('html').css('zoom' , s_zoom.factor);  // ページ倍率を変更
  e.preventDefault();
}
