let dataTableInstance = null , 
    tableData_circular, 
    columnIndex_detail = 3, // index ของคอลัมน์ "เรื่อง"
    columnIndex_results = 4,
    year,
    results,
    mati_work,
    mati_kk,  
    agency,
    categories,c_status;

  
        // เมื่อหน้าโหลดเสร็จ
        $(document).ready(function() {

            loadSelect(); // โหลดข้อมูล dropdown ทันที

            // *** ไม่โหลดรายการหนังสือเวียนอัตโนมัติ — รอให้กดค้นหาก่อน ***

            $(window).on("resize", function () { toggleDetailColumnBasedOnWidth(); });

            // เมื่อผู้ใช้กดปุ่มค้นหา
            $('#form_save').on('submit', function(e) {

                e.preventDefault();

                  const searchParts = []
                  //ปี พ.ศ. selected
                  const selectedFruitTexts_year = [];
                  const in_year_id = $('#in_year_id').val() ?? [];
                    $('#in_year_id option:selected').each(function() {
                        selectedFruitTexts_year.push($(this).text());
                    });
                  
                  //ผู้รับผิดชอบ
                  const selectedFruitTexts_ag = [];
                  const ag_id = $('#ag_id').val() ?? [];
                    $('#ag_id option:selected').each(function() {
                        selectedFruitTexts_ag.push($(this).text());
                    });
                  
                  //หมวดหมู่
                  const selectedFruitTexts_cat = [];
                  const cat_id = $('#cat_id').val() ?? [];
                    $('#cat_id option:selected').each(function() {
                        selectedFruitTexts_cat.push($(this).text());
                    });

                  //มติก.ก
                  const selectedFruitTexts_mkk = [];
                  const in_mkk_id = $('#in_mkk_id').val() ?? [];
                    $('#in_mkk_id option:selected').each(function() {
                        selectedFruitTexts_mkk.push($(this).text());
                    });

                  //ผลการพิจารณา
                  const selectedFruitTexts_result = [];
                  const in_results_id = $('#in_results_id').val() ?? [];
                    $('#in_results_id option:selected').each(function() {
                        selectedFruitTexts_result.push($(this).text());
                    });

                  //มติคณะทำงาน
                  const selectedFruitTexts_mw = [];
                  const in_mw_id = $('#in_mw_id').val() ?? [];
                    $('#in_mw_id option:selected').each(function() {
                        selectedFruitTexts_mw.push($(this).text());
                    });

                  //สถานะการใช้งาน
                  const selectedFruitTexts_status = [];
                  const status_id = $('#status_id').val() ?? [];
                    $('#status_id option:selected').each(function() {
                        selectedFruitTexts_status.push($(this).text());
                    });

                  //เลขที่หนังสือ
                  const in_num_date = $('#in_num_date').val().trim();
                  //ชื่อเรื่อง
                  const in_detail = $('#in_detail').val().trim();

                   if ( 
                       in_year_id.length === 0 && 
                       !in_num_date && 
                       !in_detail && 
                       ag_id.length === 0 &&
                       cat_id.length === 0 &&
                       in_mkk_id.length === 0 &&
                       in_results_id.length === 0 &&
                       in_mw_id.length === 0 &&
                       status_id.length === 0
                      ) {

                        Swal.fire({
                            icon: "info",
                            text: "โปรดระบุข้อมูลเพื่อค้นหา...",
                          });
                          return;
                      }


                // สร้างข้อความที่ค้นหาแบบเฉพาะที่กรอกเท่านั้น
                if (selectedFruitTexts_year.length > 0) {
                  searchParts.push(`<span class="text-decoration-underline">ปี</span> "<span class="text-primary">${selectedFruitTexts_year.join(', ')}</span>"`);
                }

                if (selectedFruitTexts_ag.length > 0) {
                  searchParts.push(`<span class="text-decoration-underline">ผู้รับผิดชอบ</span> "<span class="text-primary">${selectedFruitTexts_ag.join(', ')}</span>"`);
                }

                if (selectedFruitTexts_cat.length > 0) {
                  searchParts.push(`<span class="text-decoration-underline">หมวดหมู่</span> "<span class="text-primary">${selectedFruitTexts_cat.join(', ')}</span>"`);
                }

                if (selectedFruitTexts_mkk.length > 0) {
                  searchParts.push(`<span class="text-decoration-underline">มติก.ก.</span> "<span class="text-primary">${selectedFruitTexts_mkk.join(', ')}</span>"`);
                }

                if (selectedFruitTexts_result.length > 0) {
                  searchParts.push(`<span class="text-decoration-underline">ผลการพิจารณา</span> "<span class="text-primary">${selectedFruitTexts_result.join(', ')}</span>"`);
                }

                if (selectedFruitTexts_mw.length > 0) {
                  searchParts.push(`<span class="text-decoration-underline">มติคณะทำงาน</span> "<span class="text-primary">${selectedFruitTexts_mw.join(', ')}</span>"`);
                }

                if (selectedFruitTexts_status.length > 0) {
                  searchParts.push(`<span class="text-decoration-underline">สถานะการใช้งาน</span> "<span class="text-primary">${selectedFruitTexts_status.join(', ')}</span>"`);
                }

                if (in_num_date) {
                  searchParts.push(`<span class="text-decoration-underline">เลขที่หนังสือ/ลงวันที่</span> "<span class="text-primary">${in_num_date}</span>"`);
                }

                if (in_detail) {
                  searchParts.push(`<span class="text-decoration-underline">ชื่อเรื่อง</span> "<span class="text-primary">${in_detail}</span>"`);
                }
                // แสดงผลเฉพาะที่กรอก
                $('#searchText').html(searchParts.join(', '));
                $('#searchInfo').removeClass('d-none');

                //โหลดค่าลงตาราง
                showResultSection(); // แสดง section ผลลัพธ์ครั้งแรก
                loadBooks();

               
                
            });

             $('#clear_data').on('click', function(e) {
                  // ป้องกันพฤติกรรมปกติของลิงก์
                  e.preventDefault();
                  
                  // เรียกใช้ฟังก์ชันที่สร้างไว้
                  clearSearchForm();
                });
            
        });

// แสดง section ผลลัพธ์ (เรียกครั้งแรกหลังกดค้นหา)
function showResultSection() {
    $('#pre-search-placeholder').hide();
    $('#result-section').show();
}

function loadSelect() {
        //loadPage
        $(".form_search").waitMe({ effect: "win8_linear", text: "กำลังประมวล" });
          //main
          $.ajax({
            type: "GET",
            url: "service/api/index_main/main_select.php",
        }).done(function (resp) {

           //hide loadPage
            $(".form_search").waitMe("hide");

             //API parseJwt
            var resp = parseJwt(resp.response);

            //แสดงข้อมูล
            year = resp.response.year;
            results = resp.response.results;
            mati_work = resp.response.mati_work;
            mati_kk = resp.response.mati_kk;
            agency = resp.response.agency;
            categories = resp.response.categories;
            c_status = resp.response.c_status;


            var dd = moment.locale("th");

            //สถานะการใช้งาน
            c_status.forEach(function (item, index){
                var status_list = `<option value="${item.status_id}">${item.status_value}</option>`
                $( "#status_id" ).append( status_list )
             })

            //ปี พ.ศ.
            year.forEach(function (item, index){
                var year_list = `<option value="${item.year_id}">${item.year_value}</option>`
                $( "#in_year_id" ).append( year_list )
             })

            //ผลการพิจารณา
            results.forEach(function (item, index){
              var results_list = `<option value="${item.results_id}">${item.results_detail}</option>`
              $( "#in_results_id" ).append( results_list )
            })

            //ผู้รับผิดชอบ
            agency.forEach(function (item, index){
              var agency_list = `<option value="${item.ag_id}">${item.ag_name}</option>`
              $( "#ag_id" ).append( agency_list )
           })

            //ผู้รับผิดชอบ
           categories.forEach(function (item, index){
            var categories_list = `<option value="${item.cat_id}">${item.cat_name}</option>`
            $( "#cat_id" ).append( categories_list )
           })

            //มติ ก.ก.
            populateDropdown("#in_mkk_id", mati_kk, 'mkk_id', 'mkk_name', 'mkk_date');

            //มติคณะทำงาน
            populateDropdown("#in_mw_id", mati_work, 'mw_id', 'mw_name', 'mw_date');

           
                //มติคณะทำงาน select2
                $('#in_mw_id').each(function () {
                  $(this).select2({ 
                          placeholder : "เลือกมติคณะทำงาน",
                          dropdownParent: $(this).parent(), 
                          width: '100%',
                          allowClear: true,
                      })
                      // มติคณะทำงาน "เลือกทั้งหมด"
                      setupSelectAll('in_mw_id', 'select_all_mw');
                  })

                //มติก.ก. select2
                $('#in_mkk_id').each(function () {
                  $(this).select2({ 
                          placeholder : "ระบุมติ ก.ก.", 
                          dropdownParent: $(this).parent(), 
                          width: '100%',
                          allowClear: true,
                      })
                      // ตรวจจับเมื่อเลือก "เลือกทั้งหมด"
                      setupSelectAll('in_mkk_id', 'select_all_mkk');
                  })

                //ปี พ.ศ. select2
                $('#in_year_id').each(function () {
                  $(this).select2({ 
                          placeholder : "ระบุปี พ.ศ.",  
                          dropdownParent: $(this).parent(), 
                          width: '100%',
                          allowClear: true,
                      })

                          // ตรวจจับเมื่อเลือก "เลือกทั้งหมด"
                          setupSelectAll('in_year_id', 'select_all_year');
                          
                  })

                  //สถานะการใช้งาน select2
                $('#status_id').each(function () {
                  $(this).select2({ 
                          placeholder : "ระบุสถานะการใช้งาน",  
                          dropdownParent: $(this).parent(), 
                          width: '100%',
                          allowClear: true,
                      })

                          // ตรวจจับเมื่อเลือก "เลือกทั้งหมด"
                          setupSelectAll('status_id', 'select_all_status');
                          
                  })

                //ผลการพิจารณา select2
                $('#in_results_id').each(function () {
                  $(this).select2({ 
                          placeholder : "เลือกผลการพิจารณา", 
                          dropdownParent: $(this).parent(), 
                          width: '100%',
                          allowClear: true,
                      })
                      // ตรวจจับเมื่อเลือก "เลือกทั้งหมด"
                      setupSelectAll('in_results_id', 'select_all_results');
                  })

                //ผู้รับผิดชอบ
                $('#ag_id').each(function () {
                  $(this).select2({ 
                          placeholder : "เลือกผู้รับผิดชอบ", 
                          dropdownParent: $(this).parent(), 
                          width: '100%',
                          allowClear: true,
                      })
                        // ตรวจจับเมื่อเลือก "เลือกทั้งหมด"
                        setupSelectAll('ag_id', 'select_all_ag');
                           
                })

                 //หมวดหมู่
                 $('#cat_id').each(function () {
                  $(this).select2({ 
                          placeholder : "เลือกหมวดหมู่", 
                          dropdownParent: $(this).parent(), 
                          width: '100%',
                          allowClear: true,
                      })
                       // ตรวจจับเมื่อเลือก "เลือกทั้งหมด"
                       setupSelectAll('cat_id', 'select_all_cat');
                           
                })

          
        }).fail(function (jqXHR, textStatus, errorThrown) {
          Swal.fire({
            text: jqXHR.responseJSON?.message || "เกิดข้อผิดพลาดในการโหลดข้อมูลส่วนกลาง",
            icon: "error",
            confirmButtonText: "ตกลง",
          }).then(function () {
               location.assign("./");
          });
        });

}

function loadBooks() {
    $("#bookTable_wrapper").waitMe({ effect: "win8", text: "กำลังประมวลผล" ,waitTime: -1 });

    let data_search = { 
        in_year_id: $('#in_year_id').val(),
        in_num_date: $('#in_num_date').val().trim(),
        in_detail: $('#in_detail').val().trim(),
        ag_id: $('#ag_id').val(),
        cat_id: $('#cat_id').val(),
        in_mkk_id: $('#in_mkk_id').val(),
        in_results_id: $('#in_results_id').val(),
        in_mw_id: $('#in_mw_id').val(),
        in_status_id: $('#status_id').val(),
    };

    $.ajax({
        type: "POST",
        url: "service/api/index_main/main.php",
        data: data_search
    }).done(function (resp) {
        setTimeout(function() { $('#bookTable_wrapper').waitMe('hide'); }, 1000);
        try {
            var circular_kp = resp.response.circular_kp || [];
            var total_arr = resp.response.total_arr || [0];
            tableData_circular = [];
            $('#filter_count').text(total_arr[0]);

            circular_kp.forEach(function (item) {
                let mkk_obj = item.mati_kk || { mkk_ref: '-' };
                let mw_obj = item.mati_work || { mw_ref: '-' };
                let agency_list = item.agency || [];
                let cat_list = item.categories || [];
                let ref_list = item.references_info || [];
                
                let agency_tag = agency_list.map(a => `<span class='badge bg-dark text-white rounded mb-1 fs-15'>${a.ag_name}</span>`).join(' ');
                let agency_tag_detail = agency_list.map(a => `<span class='fs-13 text-grape'>${a.ag_name}</span>`).join(', ');
                let cat_tag = cat_list.map(c => c.cat_ref == '-' ? `<span>${c.cat_name}</span>` : `<a href="${c.cat_ref}" class="text-decoration-underline" target="_blank">${c.cat_name}</a>`).join(' ');
                
                let ref_main = ref_list.length === 0 ? 'ไม่มี' : ref_list.map(r => `<div class="card shadow-none bg-pale-blue mb-2 p-2"><span class="text-blue">เลขที่หนังสือ ${r.in_num_date}</span><p class="text-navy">${r.in_detail}</p></div>`).join('');
                
                let statusVal = (item.status_a && item.status_a.status_value) || '-';
                let statusHtml = `<i class='bx bxs-bulb' style='color:${statusVal=='ใช้งาน'?'#099a49':(statusVal=='ยกเลิก'?'#de0508':'#ccc')}'></i> <span class="${statusVal=='ใช้งาน'?'text-green':(statusVal=='ยกเลิก'?'text-red':'text-dark')}">${statusVal}</span>`;

                tableData_circular.push({
                    year: (item.year && item.year.year_value) || '-',
                    in_num_date: item.in_num_date || '-',
                    in_detail: (item.in_detail || '-') + `<br><span class='fs-13 text-grape'>ผู้รับผิดชอบ : </span>` + agency_tag_detail,
                    results_detail: (item.results && item.results.results_detail) || '-',
                    results_color: (item.results && item.results.results_color) || '000',
                    results_etc: (item.results && item.results.results_etc) || '',
                    mati_work: `${formatMatiString(mw_obj, 'mw_date', 'mw_name')} ${processText(mw_obj.mw_ref)}`,
                    mati_kk: `${formatMatiString(mkk_obj, 'mkk_date', 'mkk_name')} ${processText(mkk_obj.mkk_ref)}`,
                    agency_tag: agency_tag,
                    category_tag: cat_tag,
                    ref_main: ref_main,
                    in_etc: item.in_etc || '-',
                    in_link: item.in_link && item.in_link !== '-' ? `<a href="${item.in_link}" target="_blank" class="text-decoration-underline">${item.in_link}</a>` : '-',
                    status: statusHtml,
                    in_detail_mobile: item.in_detail || '-',
                    in_file_mkk: processText(item.in_file_mkk),
                    in_detail_ag: item.in_detail_ag || '-'
                });
            });

            initDataTable(tableData_circular); 
            updateDashboardStats(circular_kp);
        } catch (err) {
            console.error("Error processing circular data:", err);
        }
    }).fail(function (jqXHR) {
        $('#bookTable_wrapper').waitMe('hide');
        Swal.fire({
            text: jqXHR.responseJSON?.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล",
            icon: "error",
            confirmButtonText: "ตกลง"
        });
    });
}

function rebindPopovers() {
    document.querySelectorAll('[data-bs-toggle="popover"]').forEach(el => {
        const old = bootstrap.Popover.getInstance(el);
        if (old) old.dispose();
    });
    document.querySelectorAll('[data-bs-toggle="popover"]').forEach(el => {
        new bootstrap.Popover(el);
    });
}

function initDataTable(data) {
    const isMobile = window.innerWidth <= 768;
    if (dataTableInstance) {
        dataTableInstance.clear().rows.add(data).draw();
    } else {
        dataTableInstance = $("#table_index").DataTable({
            data: data,
            responsive: false,
            scrollX: true,
            columns: [
                { data: null, title: "<i class='bx bx-notepad fs-23' style='color: #00744B;' ></i>", className: "details-control text-center", orderable: false, defaultContent: "", width: "4%" },
                { data: "year", title: "ปี พ.ศ.", className: "align-middle text-center", width: "7%" },
                { data: "in_num_date", title: "เลขที่หนังสือ", className: "align-middle fs-16", width: "27%" },
                { data: "in_detail", title: "เรื่อง", className: "align-middle", width: "45%" },
                { 
                    data: "results_detail", 
                    title: "ผลการพิจารณา", 
                    className: "align-middle", 
                    width: "20%",
                    render: function (cellData, type, row) {
                        const content = String(row.results_detail || "").replaceAll('"','&quot;');
                        return `
                          <span class="fs-17" tabindex="0" style="color: #${row.results_color}; cursor: help;"
                            data-bs-toggle="popover" data-bs-title="${content}" data-bs-content="${row.results_etc}"
                            data-bs-trigger="hover" data-bs-container="body" data-bs-placement="bottom"
                            data-bs-custom-class="custom-popover-wide">
                            ${cellData ?? "-"} <i class='bx bx-comment-detail'></i>
                          </span>`;
                    },
                },
            ],
            columnDefs: [ { targets: columnIndex_detail, visible: !isMobile, className: "in_detail_column" } ],
            pageLength: 15,
            lengthMenu: [ [15, 10, 20, 50, -1], [15, 10, 20, 50, "ทั้งหมด"] ],
            searching: false,
            info: false,
            ordering: false,
            bLengthChange: true,
            autoWidth: true,
            paginate: true,
            dom: "<'top'Bf>t<'bottom custom-bottom lp-wrapper'lp><'clear'>",
            language: {
                lengthMenu: "แสดงข้อมูล _MENU_ แถว",
                zeroRecords: "ไม่มีข้อมูล",
                info: "แสดง _START_ ถึง _END_ จากทั้งหมด _TOTAL_ รายการ",
                infoEmpty: "ไม่พบข้อมูลที่ต้องการ",
                search: "ค้นหา",
                paginate: { previous: "ก่อนหน้านี้", next: "หน้าต่อไป" }
            },
            drawCallback: function () { rebindPopovers(); },
            initComplete: function () {
                toggleDetailColumnBasedOnWidth();
                $(window).on("resize", toggleDetailColumnBasedOnWidth);
                $("#table_index tbody").on("click", "td.details-control", function () {
                    const tr = $(this).closest("tr");
                    const row = dataTableInstance.row(tr);
                    if (row.child.isShown()) {
                        $('div.details-slide', row.child()).slideUp(200, function () {
                            row.child.hide();
                            tr.removeClass("shown");
                        });
                    } else {
                        row.child(format(row.data())).show();
                        $('div.details-slide', row.child()).hide().slideDown(200);
                        tr.addClass("shown");
                        rebindPopovers();
                    }
                });
                $('#table_index_length select').addClass('custom-arrow');
                rebindPopovers();
            }
        });
    }
}

function toggleDetailColumnBasedOnWidth() {
    if (!dataTableInstance) return;
    const isMobile = window.innerWidth <= 768;
    dataTableInstance.column(columnIndex_detail).visible(!isMobile);
    dataTableInstance.column(columnIndex_results).visible(!isMobile);
}

function escAttr(str) {
    return String(str ?? "").replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll("'",'&#39;').replaceAll('<','&lt;').replaceAll('>','&gt;');
}

function format(d) {
    return `
      <div class="details-slide">
        <table cellpadding="5" cellspacing="0" border="0" style="padding-left:50px;" class="bg-white">
          <tr class="only-mobile">
            <td style="color: #006d4a;">เรื่อง :</td>
            <td>${d.in_detail_mobile}</td>
          </tr>
          <tr class="only-mobile">
            <td style="color: #006d4a;">ผลการพิจารณา :</td>
            <td> 
              <span class="fs-16" style="color: #${d.results_color};" tabindex="0"
                data-bs-toggle="popover" data-bs-title="${escAttr(d.results_detail)}" data-bs-content="${d.results_etc}"
                data-bs-trigger="hover" data-bs-container="body" data-bs-placement="bottom"
                data-bs-custom-class="custom-popover-wide">
                ${d.results_detail} <i class='bx bx-comment-detail'></i>
              </span>
            </td>
          </tr>
          <tr><td style="color: #006d4a;">มติคณะทำงาน :</td><td>${d.mati_work}</td></tr>
          <tr><td style="color: #006d4a;">มติ ก.ก :</td><td>${d.mati_kk}</td></tr>
          <tr><td style="color: #006d4a;">มติ ก.ก (เฉพาะเรื่อง):</td><td>${d.in_file_mkk}</td></tr>
          <tr><td style="color: #006d4a;">ผู้รับผิดชอบ :</td><td>${d.agency_tag}</td></tr>
          <tr><td style="color: #006d4a;">เหตุผลจากส่วนราชการ :</td><td>${d.in_detail_ag}</td></tr>
          <tr><td style="color: #006d4a;">หมวดหมู่ :</td><td>${d.category_tag}</td></tr>
          <tr><td style="color: #006d4a;">การอ้างถึง :</td><td>${d.ref_main}</td></tr>
          <tr><td style="color: #006d4a;">หมายเหตุ :</td><td>${d.in_etc}</td></tr>
          <tr><td style="color: #006d4a;">LINK เว็บไซต์ต้นทาง :</td><td>${d.in_link}</td></tr>
        </table>
      </div>`;
}

function clearSearchForm() {
    const form = $('#form_save');
    form.find('input[type="text"]').val('');
    form.find('select').val(null).trigger('change');
}

function formatMatiString(dataObject, dateKey, nameKey) {
    const dateValue = dataObject[dateKey];
    const nameValue = dataObject[nameKey];
    if (dateValue === '2222-01-01' || !dateValue) return `<span> ${nameValue || '-'} </span>`;
    const formattedDate = moment(dateValue).add(543, "year").format("LL");
    return `<span>ครั้งที่ ${nameValue} วันที่ ${formattedDate}</span>`;
}

function updateDashboardStats(data) {
    if (!data) return;
    const counts = {
        all: data.length,
        use: data.filter(i => i.results && i.results.results_id == 2).length,
        adjust: data.filter(i => i.results && i.results.results_id == 4).length,
        notuse: data.filter(i => i.results && i.results.results_id == 5).length,
        pending: data.filter(i => i.results && i.results.results_id == 12).length,
        missing: data.filter(i => i.results && i.results.results_id == 11).length
    };
    animateCount('#pub-count-all', counts.all);
    animateCount('#pub-count-use', counts.use);
    animateCount('#pub-count-adjust', counts.adjust);
    animateCount('#pub-count-notuse', counts.notuse);
    animateCount('#pub-count-pending', counts.pending);
    animateCount('#pub-count-missing', counts.missing);
}

function animateCount(el, target) {
    let currentText = $(el).text().replace(/,/g, '');
    let start = isNaN(parseInt(currentText)) ? 0 : parseInt(currentText);
    let duration = 600, steps = 30, diff = target - start;
    if (diff === 0) { $(el).text(target.toLocaleString()); return; }
    let step = Math.ceil(Math.abs(diff) / steps);
    if (diff < 0) step = -step;
    let timer = setInterval(function() {
        start += step;
        if ((diff > 0 && start >= target) || (diff < 0 && start <= target)) { start = target; clearInterval(timer); }
        $(el).text(start.toLocaleString());
    }, duration / steps);
}

function setupSelectAll(id, allId) {
    $(`#${id}`).on('select2:select', function (e) {
        if (e.params.data.id === 'all') {
            $(this).val($(this).find('option').not('[value="all"]').map(function() { return this.value; }).get()).trigger('change');
        }
    });
}

function processText(text) {
    if (!text || text === '-') return '-';
    if (text.startsWith('http')) return `<a href="${text}" target="_blank" class="text-decoration-underline">ลิงก์</a>`;
    return `<a href="/uploads/${text}" target="_blank" class="text-decoration-underline">ไฟล์ PDF</a>`;
}

function populateDropdown(targetId, dataSource, idKey, nameKey, dateKey) {
    dataSource.forEach(function (item) {
        let displayText;
        const dateValue = item[dateKey];
        if (dateValue === '2222-01-01' || !dateValue) displayText = ` ${item[nameKey]} `;
        else displayText = `ครั้งที่ ${item[nameKey]} วันที่ ${moment(dateValue).add(543, "year").format("LL")}`;
        $(targetId).append(`<option value="${item[idKey]}">${displayText}</option>`);
    });
}
