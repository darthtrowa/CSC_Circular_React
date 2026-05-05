  //ตัวอักษร
  function isCharacterKey(evt) {
    var charCode = (evt.which) ? evt.which : event.keyCode;
    if (charCode >= 3585 && charCode <= 3673 || charCode >= 65 && charCode <= 90 || charCode >= 97 && charCode <= 122 || charCode <= 32 || charCode === 45)
      return true;
    return false;
  }

  function ValidateKey_mail() 
  {   
  var key=window.event.keyCode;
  var allowed='1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ._-@"\'';
  return allowed.indexOf(String.fromCharCode(key)) !=-1 ;
  }

  function ValidateKey_password() 
  {   
  var key=window.event.keyCode;
  var allowed='1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ@#\$';
  return allowed.indexOf(String.fromCharCode(key)) !=-1 ;
  }