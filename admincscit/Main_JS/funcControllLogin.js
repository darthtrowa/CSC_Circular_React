

let validator_register,
validator_forgot,
validator_login


$(function() {
     /** Function Modal createItem Form */
     $('#createItem').on('click', function (e) {
            e.preventDefault()
            new bootstrap.Modal($('#modal-register'), {
                keyboard: false
            }).show()
            /** reset modal*/ 
            
            // $("#submitCreate").addClass("disabled")
            $('input').removeClass('is-invalid')
                      .removeClass('is-valid')

              
      })

      $('#close_modal_create').on('click', function (e) {
          $('#modal-register').modal('toggle');
      })

    

})


/** check validator start*/
validator_register = $('#form_register').validate({
      submitHandler: function(form) {
          Swal.fire({
                    title: "โปรดตรวจสอบข้อมูล....",
                    text: "ท่านต้องการบันทึกข้อมูลใช่หรือไม่ ?",
                    icon: 'info',
                    showDenyButton: true,
                    confirmButtonColor: '#3085d6',
                    confirmButtonText: 'ใช่! บันทึกเลย',
                    denyButtonText: `ยกเลิก`
                  }).then((result) => {
                    if (result.isConfirmed) {
                      $('<input>').attr({
                            type: 'hidden',
                            name: 'submitCreate_hidden',
                            value: 'Save'
                          }).appendTo('#form_register')

                      $('#form_register').waitMe({
                            effect : 'timer',
                            text : 'รอสักครู่....'})

                      let data = $(form).serialize()
                      $.ajax({
                          type: 'POST',
                          url: "service/register/create.php",
                          data: data,
                          cache: false,             
                          processData: false
                          }).done(function(resp){ 
                            Swal.fire({
                                  text: resp.message,
                                  icon: 'success',
                                  confirmButtonText: 'ตกลง',
                              }).then(() => {
                                  //$('#form_register').waitMe("hide");
                                  location.reload()
                              })
                          }).fail(function(jqXHR, textStatus, errorThrown){ 
                            Swal.fire({
                                  text: jqXHR.responseJSON.message,
                                  icon: 'error',
                                  confirmButtonText: 'ตกลง',
                              }).then(() => {
                                    
                                   $("#form_register [name=submitCreate_hidden]").remove()
                                   $('#form_register').waitMe("hide");
                              })
                          })
                    }else if (result.isDenied) {
                          
                         $("#form_register [name=submitCreate_hidden]").remove()
                    }
                })
            return false;
        },

          rules:{
            a_name: { 
                required: true,
                maxlength: 100,
                noSpace: true,
                lettersOnly: true
              },

              a_username: { 
                required: true,
                noSpace: true,
                regexUsername: true,
                LettersNumberAddSharpDoll_username: true
               
              },
            
              a_password: { 
                required: true,
                noSpace: true,
                regexPassword: true,
                LettersNumberAddSharpDoll: true
              },
              a_password_re: { 
                required: true,
                equalTo: '#a_password',
                noSpace: true,
                regexPassword: true,
                LettersNumberAddSharpDoll: true
              }
          },
          messages:{
            a_name: {
                required: 'โปรดกรอกชื่อ',
                maxlength: 'ตัวอักษรยาวเกินไป',
                noSpace: 'ชื่อไม่ควรมีช่องว่าง' 
              },

              a_username: { 
                required: 'โปรดกรอกชื่อผู้ใช้งาน',
                noSpace: 'ไม่ควรมีช่องว่าง'
              },
             
              a_password: { 
                required: 'โปรดกรอกรหัสผ่าน',
                noSpace: 'ไม่ควรมีช่องว่าง'
              },
              a_password_re: { 
                required: 'โปรดกรอกรหัสผ่าน',
                equalTo: 'รหัสผ่านไม่ตรงกัน',
                noSpace: 'ไม่ควรมีช่องว่าง' 
              }
          },
          errorElement: 'div',
          errorPlacement: function( error, element){
              error.addClass( 'invalid-feedback px-2' )
              error.insertAfter( element )
          },
          highlight: function ( element, errorClass, validClass ) {
              $( element ).addClass( 'is-invalid' ).removeClass( 'is-valid' ) 
          },
          unhighlight: function ( element, errorClass, validClass ){
              $( element ).addClass( 'is-valid' ).removeClass( 'is-invalid' ) 
          }
      })
/** check validator end*/






/** forgot pass start*/
validator_login = $('#form_login').validate({
      submitHandler: function(form) {
                   $('<input>').attr({
                      type: 'hidden',
                      name: 'login_submit_hidden',
                      value: 'Save'
                     }).appendTo('#form_login')

                      let data_login = $(form).serialize()

                      toastr.options = { "progressBar": true, "timeOut": "2800", "showEasing": "swing" }

                      $('#row_login').waitMe({ effect : 'pulse', text : 'กำลังตรวจสอบข้อมูล....' })

                      $.ajax({
                          type: 'POST',
                          url: "/admincscit/service/auth/login.php",
                          data: data_login,
                          cache: false,             
                          processData: false
                          }).done(function(resp){ 
                            window.toastr.remove();
                              toastr.success('สวัสดีคุณ '+resp.response,'เข้าสู่ระบบสำเร็จ!!!')
                              setTimeout(() => {
                                  location.href = '/admin/dashboard'
                                }, 2800)
                          }).fail(function(resp){ 
                              toastr.error(resp.responseJSON.message,'เกิดข้อผิดพลาด!!!')
                              $('#row_login').waitMe("hide");
                              $("#form_login [name=login_submit_hidden]").remove()
                              $('#loginPassword').val('');
                              $("#loginPassword").focus();
                          })
            return false;
        },
          rules:{
              loginUsername: { 
                required: true
              },
              loginPassword: { 
                required: true
              }
          },
          messages:{
            loginUsername: { 
                required: 'โปรดกรอกชื่อผู้ใช้งาน'
              },
              loginPassword: { 
                required: 'โปรดกรอกรหัสผ่าน'
              }
          },
          errorElement: 'div',
          errorPlacement: function( error, element){
              error.addClass( 'invalid-feedback px-2' )
              error.insertAfter( element )
          },
          highlight: function ( element, errorClass, validClass ) {
              $( element ).addClass( 'is-invalid' ).removeClass( 'is-valid' ) 
          },
          unhighlight: function ( element, errorClass, validClass ){
              $( element ).addClass( 'is-valid' ).removeClass( 'is-invalid' ) 
          }
      })


$('#modal-register').on('hidden.bs.modal', function (e) {
    $(this)
    .find("input,textarea,select") .val('') .end() .find("input[type=checkbox], input[type=radio]") .prop("checked", "") .end();
    //reset jquery validator
    validator_register.resetForm();
    $("#form_register [name=submitCreate_hidden]").remove()
})




