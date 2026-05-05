  //noSpace for validate
  jQuery.validator.addMethod("noSpace", function(value, element) { 
    return value.indexOf(" ") < 0 && value != ""; 
 },'ไม่ควรมีช่องว่าง');

 //noSpace for validate
 jQuery.validator.addMethod("noSpaceDouble", function(value, element) { 
    return value.indexOf("  ") < 0 && value != ""; 
 },'ช่องว่างไม่ควรมากกว่า 1 ช่อง');


//LettersAndNumber for validate
 jQuery.validator.addMethod("LettersAndNumber", function(value, element) {
        return this.optional(element) || /^[a-zA-Zก-๏0-9]+$/i.test(value);
    }); 

//lettersOnly for validate
 jQuery.validator.addMethod("lettersOnly", function(value, element) {
        return this.optional(element) || /^[a-zA-Zก-๏]+$/i.test(value);
    },'กรุณาใช้ตัวอักษรเท่านั้น'); 



//lettersOnly_last_name for validate
   jQuery.validator.addMethod("lettersOnly_last_name", function(value, element) {
    return this.optional(element) || /^[a-zA-Zก-๏ ]+$/i.test(value);
  },'กรุณาใช้ตัวอักษรเท่านั้น'); 


  //lettersOnly_last_name_thaiOnly for validate
  jQuery.validator.addMethod("lettersOnly_last_name_thaiOnly", function(value, element) {
    return this.optional(element) || /^[ก-๏ ]+$/i.test(value);
  },'กรุณาใช้ตัวอักษรภาษาไทยเท่านั้น'); 

//LettersAndNumberDotSlashSpaceThaiOnly for validate [อังกฤษ]+[ไทย]+[เลข0-9]+[./]
jQuery.validator.addMethod("LettersAndNumberDotSlashSpaceThaiOnly", function(value, element) {
    return this.optional(element) || /^[ก-๏0-9./ ]+$/i.test(value);
}); 



// [อังกฤษ]+[ไทย]+[เลข0-9]+[./]
jQuery.validator.addMethod("NumberSlash", function(value, element) {
    return this.optional(element) || /^[0-9/]+$/i.test(value);
}); 


//LettersAndNumberDotSlashSpace for validate [อังกฤษ]+[ไทย]+[เลข0-9]+[./]
 jQuery.validator.addMethod("LettersAndNumberDotSlashSpace", function(value, element) {
        return this.optional(element) || /^[a-zA-Zก-๏0-9./ ]+$/i.test(value);
    }); 



    jQuery.validator.addMethod("LettersForCircular", function(value, element) {
        // ตรวจ: มีเฉพาะ อักษรไทย อังกฤษ เลข และ . / - ( ) เว้นวรรค
        const allowedChars = /^[a-zA-Zก-๙0-9./\-() ]+$/i.test(value);
        // ตรวจ: ไม่มีเว้นวรรคซ้ำกันเกิน 1 ช่อง
        const noDoubleSpaces = !/ {2,}/.test(value);
        return this.optional(element) || (allowedChars && noDoubleSpaces);
      }, "กรุณากรอกเฉพาะตัวอักษรไทย อังกฤษ ตัวเลข . / - ( ) และห้ามเว้นวรรคติดกันเกิน 1 ช่อง");


      

    //LettersAndNumberDotSlashSpace for validate [อังกฤษ]+[ไทย]+[เลข0-9]+[./]
 jQuery.validator.addMethod("LettersAndNumberSlashSpace", function(value, element) {
    return this.optional(element) || /^[a-zA-Zก-๏0-9/ ]+$/i.test(value);
}); 

    //LettersAndNumberDotSlashSpace for validate [อังกฤษ]+[ไทย]+[เลข0-9]+[./,]
 jQuery.validator.addMethod("LettersAndNumberDotSlashCommaSpace", function(value, element) {
    return this.optional(element) || /^[a-zA-Zก-๏0-9./, ]+$/i.test(value);
}); 

    //LettersNumberAddSharpDoll for validate
   jQuery.validator.addMethod("LettersNumberAddSharpDoll", function(value, element) {
    return this.optional(element) || /^[a-zA-Z0-9@#$]+$/i.test(value);
  },'รหัสผ่านต้องเป็นอักษรภาษาอังกฤษ/ตัวเลข/อักษรพิเศษ @ # $ เท่านั้น'); 


  //emailEx for validate
 jQuery.validator.addMethod("emailEx", function(value, element) {
    return this.optional(element) || /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/.test(value);
},'รูปแบบ Email ไม่ถูกต้อง'); 



 //LettersNumberAddSharpDoll for validate
 jQuery.validator.addMethod("LettersNumberAddSharpDoll_username", function(value, element) {
    return this.optional(element) || /^[a-zA-Z0-9@._]+$/i.test(value);
  },'ขออภัยอนุญาตให้ใช้เฉพาะตัวอักษรภาษาอังกฤษ, ตัวเลข (0-9), และเครื่องหมาย (.)(@)(_) เท่านั้น'); 


//LettersNumberAddSharpDoll for validate
 jQuery.validator.addMethod("number_only", function(value, element) {
    return this.optional(element) || /^[0-9]+$/i.test(value);
  },'ขออภัยอนุญาตให้ใช้เฉพาะตัวเลข (0-9) เท่านั้น'); 
  

  

//regexPassword
jQuery.validator.addMethod("regexUsername", function (value, element) {
    let password = value;
    if (!(/^(.{8,30}$)/.test(password))) {
        return false;
    }
    return true;
}, function (value, element) {
    let password = $(element).val();
    if (!(/^(.{8,30}$)/.test(password))) {
        return 'ชื่อผู้ใช้งานต้องมีความยาวระหว่าง 8 ถึง 30 ตัวอักษร';
    }
    return false;
});



//regexPassword
jQuery.validator.addMethod("regexPassword", function (value, element) {
    let password = value;
    if (!(/^(?=.*[a-z])(?=.*[A-Z])(.{8,20}$)/.test(password))) {
        return false;
    }
    return true;
}, function (value, element) {
    let password = $(element).val();
    if (!(/^(.{8,20}$)/.test(password))) {
        return 'รหัสผ่านต้องมีความยาวระหว่าง 8 ถึง 20 ตัวอักษร';
    }
    else if (!(/^(?=.*[A-Z])/.test(password))) {
        return 'รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อยหนึ่งตัว';
    }
    else if (!(/^(?=.*[a-z])/.test(password))) {
        return 'รหัสผ่านต้องมีตัวพิมพ์เล็กอย่างน้อยหนึ่งตัว';
    }
    return false;
});


//filesize
jQuery.validator.addMethod('filesize', function(value, element, param) {
    return this.optional(element) || (element.files[0].size <= param) 
});



/* Blacklist คำกรอก Array */
var blacklist = ['สล็อต', 'ไฮโล', 'โจ๊กเกอร์', 'pg', 'huay', 
                'แตกในดอดคอม', 'แตก', 'เถื่อน', 'เข้าสู่ระบบ', 'วีไอพี', 'ล็อตโต้วีไอพี', 'สล็อต ',
                 ' สล็อต', '  สล็อต', 'สล็อต  ', 'ddสล็อต', 'นอยพิเศษ', 'ล็อตโต้ วีไอพี', 'ฮานอยพิเศษ'
                 , 'ฮานอยพิเศษ', 'ล็อตโต้', 'รวยดอทคอม', 'สมาชิก เข้าสู่ระบบ', 'แตกใน.คอม', 'เว็ปนอก'
                 , 'เว็บ นอก', 'สูตรไฮโล', 'ไฮโล ทดลองเล่น', 'เเตกในดอทคอม', 'เกมสล็อตนอก', 'โจ๊กเกอร์pg'
                 , 'ไฮโลทดลอง', 'huay เข้าสู่ระบบ ลงทะเบียน', 'แตกในดอลคอม', 'สูตรไฮโล', 'แตกในดอมคอม', 'สูตรไฮโลออนไลน์'
                 , 'สมัครเว็บนอก', 'พนัน', 'สูตร ไฮโล ออนไลน์', 'เกมสล็อต', 'ทดลองเล่นสล็อต', 'สล็อตเว็บนอก ใหญ่ ที่ สุด'
                 , 'สล็อตเว็บนอก', 'สล็อตเว็บ', 'สล็อต เว็บ', 'แตก ใน ด อ ท คอม', 'ล้อตโต้วีไอพี', 'สล็อตเว็บนอก ใหญ่ ที่ สุด'
                 , 'รวยดอทคอม', 'ล็อคโต้', 'เว ป นอก', 'แตกใน คอม คอมอม', 'เลขวิ่งบนตัวเดียว ล้านเปอร์เซ็นต์', 'สูตร ไฮโล', 'อารัวก้า', 'อารัว'
                 , 'หวย', 'หวยแม่จําเนียร', 'เบทฟิก', 'ฝันเห็นอวัยวะเพศหญิง', 'เดโม่สล็อต', 'ราคาบอลไหล', 'รวยจัง', 'รวย', 'สล็อตปลอม', 'ทีเด็ด 6เซียน ฟัน ธง'
                 , 'ฮานอยวีไอพีย้อนหลัง', 'ทีเด็ดบอลสูง', 'เลขเด็ดหวยลาววันนี้', 'สถิติหวยลาว', 'เกมทะลึ่ง', 'หวยยี่กี', 'สล็อตเว็บนอก ลิขสิทธิ์แท้', 'เว็บตรงไม่ผ่านเอเย่นต์ ฝากถอน ไม่มี ขั้น ต่ํา'
                 , 'สล็อตเว็บนอก ลิขสิทธิ์แท้', 'ฮานอยปกติ', 'บอลไหล', 'อัพทูยูสล็อต', 'วิเคราะห์บอลวันนี้ทุกลีก ทุกคู่', 'ลาวสตาร์ย้อนหลัง', 'บาคาร่า', 'หวยลาวสตาร์', 'รวมเลขดับบนทุกหลัก', 'ทดลองเล่นบาคาร่าเช็กชี่', 'มหาทักษาไทยรัฐ'
                 , 'ยักษ์เขียวสล็อต', 'หวยซองฮานอยวันนี้', 'อเวจีสล็อต', 'ผลนิเคอิย้อนหลัง', 'เว็บหวยลาว', 'ม้าสีหมอก'
                 , 'หวยแม่จําเนียรไทยรัฐ เดลินิวส์', 'หวยไทยรัฐ แม่จำเนียร', 'หวยไทยรัฐเดลินิวส์', 'คิงสล็อต', 'วิเคราะห์บอลวันนี้ ทุกลีก ทุกคู่ วันนี้', 'เกมเกย์', 'โหลด แอ พ รับเครดิตฟรี ถอนได้ ล่าสุด', 'สล๊อต'];

jQuery.validator.addMethod("word_validate", function(value) {
    return $.inArray(value, blacklist) == -1;
}, 'รูปแบบ คำ/อักษร มีความสุ่มเสี่ยง..');


// เพิ่ม validator ชื่อว่า "hexcolor"
jQuery.validator.addMethod("hexcolor", function (value, element) {
  return this.optional(element) || /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value);
}, "กรุณากรอกรหัสสี HEX ที่ถูกต้อง เช่น #FF0000 หรือ #F00");


