//สำหรับ มติ ก.ก.
function processText(text) {
            let link_file = "";
            // เคลียร์ space รอบข้าง
            text = text.trim();

            if (text === "-") {
              link_file = `<span class="text-red fs-16">**ไม่ได้ใส่ Link/Upload File</span>`;
            } else if (/^(http|https):\/\/.+/.test(text)) {
              // ถ้าเป็น URL
              link_file = `<br class="only-mobile-break"><a href="${text}" class="text-red hover-2" target="_blank"><i class='bx bx-link-alt bx-tada' ></i> Click เพื่อดูไฟล์ มติ ก.ก.</a>`;
            } else if (/\.pdf$/i.test(text)) {
              const filePath = "uploads/" + text;
              link_file = `<a class="fs-16 text-blue hover-2" href="${filePath}" target="_blank">Click เพื่อดูไฟล์ มติ ก.ก. เฉพาะเรื่อง <i class='bx bx-link-alt bx-tada' ></i></a>`;
            } else {
              // กรณีไม่เข้าเงื่อนไขไหนเลย (optional แล้วแต่จะทำอะไร เช่นแจ้งเตือน)
              link_file = "ข้อมูลไม่ถูกต้อง";
            }
            return link_file;
          }


          function processText_mw(text) {
            let link_file = "";
            // เคลียร์ space รอบข้าง
            text = text.trim();

            if (text === "-") {
              link_file = `<span class="text-red fs-16">**ไม่ได้ใส่ Link/Upload File</span>`;
            } else if (/^(http|https):\/\/.+/.test(text)) {
              // ถ้าเป็น URL
              link_file = `<br class="only-mobile-break"> 
              <a href="${text}" class="text-red hover-2" target="_blank">
              <i class='bx bx-link-alt bx-tada' ></i> Click เพื่อดูไฟล์ มติคณะทำงาน</a>`;
            } else if (/\.pdf$/i.test(text)) {
              const filePath = "../uploads/" + text;
              link_file = `<a class="btn btn-primary btn-sm" href="${filePath}" target="_blank">ไฟล์ upload</a>`;
            } else {
              // กรณีไม่เข้าเงื่อนไขไหนเลย (optional แล้วแต่จะทำอะไร เช่นแจ้งเตือน)
              link_file = "ข้อมูลไม่ถูกต้อง";
            }
            return link_file;
          }


          //ตรวจสอบ xss
          function escapeHTML(str) {
            if (typeof str !== 'string') return str;
            return str
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
            }


  
      const toggleBtn = $("#toggleSectionBtn");
      const formSection = $(".form_search");

      let isVisible = true;

      toggleBtn.on('click', function () {
        isVisible = !isVisible;

        if (isVisible) {
          formSection.slideDown();
          toggleBtn.html("<i class='bx bx-hide'></i>&nbsp;&nbsp;ซ่อนเงื่อนไขการค้นหา");
          toggleBtn.removeClass("btn-red").addClass("btn-green");
        } else {
          formSection.slideUp();
          toggleBtn.html("<i class='bx bx-pie-chart bx-spin'></i>&nbsp;&nbsp;แสดงเงื่อนไขการค้นหา");
          toggleBtn.removeClass("btn-green").addClass("btn-red");
        }
      });





          //jwtConvert
      function parseJwt (token) {
          var base64Url = token.split('.')[1];
          var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          return JSON.parse(jsonPayload);
      }



      //เลือกทั้งหมด select2
      function setupSelectAll(selectId, selectAllValue) {
        $(`#${selectId}`).on('select2:select', function(e) {
          const selectedValue = e.params.data.id;

          if (selectedValue === selectAllValue) {
            let allValues = [];

            $(`#${selectId} option`).each(function() {
              const val = $(this).val();
              if (val !== selectAllValue && val !== "") {
                allValues.push(val);
              }
            });

            // ตั้งค่าทุกค่า ยกเว้น select_all และ trigger change
            $(this).val(allValues).trigger('change');
          }
        });
      }







