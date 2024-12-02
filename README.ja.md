# Metadata Viewer
*Read this in other languages: [English](README.md), [日本語](README.ja.md).*  

PNGやJPEG、WEBPなどに埋め込まれたプロンプトの情報をインスペクターに表示したり、メモにコピーする[Eagle](https://en.eagle.cool/)用のプラグインです。  

## 機能
- PNGやJPEG、WEBPなどに埋め込まれたプロンプトの情報をインスペクターに表示する。
- PNGやJPEG、WEBPなどに埋め込まれたプロンプトの情報をメモにコピーする。
  - 画像を選択して右クリックし、「プラグイン > Metadata Viewer」を選択し、メモにコピーしたい内容を選択して「Send to memo」を押す。

## インストール方法
### Node.jsをインストールする（既にNode.jsが入っている方は省略可能）
- [公式サイト](https://nodejs.org/)からNode.jsをダウンロードしてインストールする。

### このリポジトリをcloneし、依存パッケージをインストールする
- 適当なフォルダ内でコマンドプロンプトを開き、以下のコマンドを実行する。
```shell
git clone https://github.com/nkchocoai/Eagle-MetadataViewer.git
cd Eagle-MetadataViewer
npm install
```

### プラグインをインポートする
- Eagle を開く。
- ツールバーの 「プラグイン」 ボタンをクリックする。
- ポップアップメニューで、「開発者オプション...」 を選択する。
- 「ローカルプロジェクトをインポート」 を選択する。
- Eagle-MetadataViewer のフォルダを選択する。

## Eagle プラグインを実行する
詳しくは [この記事](https://developer.eagle.cool/plugin-api/v/ja-jp/get-started/readme) をご覧ください。
