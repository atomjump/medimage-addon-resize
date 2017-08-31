; Script generated by the Inno Setup Script Wizard.
; SEE THE DOCUMENTATION FOR DETAILS ON CREATING INNO SETUP SCRIPT FILES!

#define MyAppName "MedImage Server Add-on Resize"
#define MyAppShortName "Resize"
#define MyAppGitName "resize"
#define MyAppLCShortName "resize"
#define MyAppVersion "0.1.0"
#define MyAppPublisher "AtomJump"
#define MyAppURL "http://medimage.co.nz"
#define MyAppExeName "winstart-browser.bat"

#define MyAppIcon "medimage.ico"

#define NSSM "nssm.exe"
#define NSSM32 "nssm-x86.exe"
#define NSSM64 "nssm.exe"
#define NODE64 "node-v4.2.6-x64.msi"
#define NODE "node-v4.2.6-x64.msi"


;Change this dir depending on where you are compiling from. Leave off the trailing slash
#define STARTDIR "C:\test\buildSoftwareMedImage\MedImage-Addons"
#define DEFAULTPHOTOSDIR "C:\medimage\photos"
#define DEFAULTAPPDIR "C:\medimage\addons\resize"



[Setup]
; NOTE: The value of AppId uniquely identifies this application.
; Do not use the same AppId value in installers for other applications.
; (To generate a new GUID, click Tools | Generate GUID inside the IDE.)
AppId={{839177C5-0FC1-4E30-BF22-39D37A10556E}}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName=C:\{#MyAppShortName}
DisableWelcomePage=no
DisableDirPage=yes
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
;LicenseFile={#STARTDIR}\LICENSE.txt
OutputDir={#STARTDIR}
OutputBaseFilename={#MyAppShortName}Installer
SetupIconFile={#STARTDIR}\{#MyAppShortName}\winstaller\{#MyAppIcon}
Compression=lzma
SolidCompression=yes
UninstallDisplayIcon={#STARTDIR}\{#MyAppShortName}\winstaller\{#MyAppIcon}
PrivilegesRequired=admin



[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"


[Files]
Source: "{#STARTDIR}\{#MyAppShortName}\winstaller\{#MyAppIcon}"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#STARTDIR}\{#MyAppShortName}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
; NOTE: Don't use "Flags: ignoreversion" on any shared system files


[Icons]
 

; Here's an example of how you could use a start menu item for just Chrome, no batch file
;Name: "{group}\{#MyAppName}"; Filename: "{pf32}\Google\Chrome\Application\chrome.exe"; Parameters: "--app=http://localhost:5566 --user-data-dir=%APPDATA%\{#MyAppShortName}\"; IconFilename: "{app}\{#MyAppIcon}"


[Code]
var
  DirPage: TInputDirWizardPage;

var DefaultDir: String;
var Message: String;

function GetDir(Param: String): String;
begin
  Result := DirPage.Values[StrToInt(Param)];
end;

procedure InitializeWizard;
begin
  //Select a default path to copy into - and special case MT32 in NZ
  DefaultDir :=  ExpandConstant('{#DEFAULTAPPDIR}');

  //Get previous data if it exists
  DefaultDir := GetPreviousData('Directory1', DefaultDir);
  Message := '';
    
  
  // create a directory input page
  DirPage := CreateInputDirPage(wpSelectDir, 'Please select the folder where the add-on is to be installed', 'Existing folders will be overriden.', Message, False, 'New Addon Folder');
  // add directory input page items
  DirPage.Add('Add-on Directory');
 
 
 
  // assign default directories for the items from the previously stored data; if
  // there are no data stored from the previous installation, use default folders
  // of your choice

  DirPage.Values[0] := DefaultDir;
 
end;

procedure RegisterPreviousData(PreviousDataKey: Integer);
begin
  // store chosen directories for the next run of the setup
  SetPreviousData(PreviousDataKey, 'Directory1', DirPage.Values[0]);
end;


procedure BeforeMyProgInstall(S: String);
begin
end;

procedure DeinitializeSetup();
begin
  //Restart any existing services stopped in the BeforeMyProgInstall
end;

procedure ExecuteRealProgram();
var
    ResultCode: Integer;
begin
    if Exec(ExpandConstant('{pf64}\nodejs\node.exe'), ExpandConstant('{app}\install.js') + ' ' + ExpandConstant('""{code:GetDir|0}""'), '', SW_HIDE, ewWaitUntilTerminated, ResultCode)
    then
    begin
        if not (ResultCode = 0) then   
        begin
            MsgBox('Warning: There was a problem during installation ' + ExpandConstant('{code:GetDir|0}') + '.', mbCriticalError, MB_OK);
        end;
    end
    else 
    begin
        MsgBox('Warning: There was a problem during installation ' + ExpandConstant('{code:GetDir|0}') + '.', mbCriticalError, MB_OK);
    end;
end;



[Registry]


[Run]



; postinstall launch



; Write to config
Filename: "{sys}\net.exe"; WorkingDir: "{tmp}"; StatusMsg:"Trying to set your configuration. Please wait.";  AfterInstall: ExecuteRealProgram; Flags: runhidden runascurrentuser;


[UninstallRun]

; Remove all leftovers
Filename: "{sys}\rmdir"; Parameters: "-r ""{app}"""; Flags: runascurrentuser;