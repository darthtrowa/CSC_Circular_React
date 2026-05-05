
let myChart2

function selectReport2(point, el, type){
    setActive2(el)
    myChart2.destroy()
    renderChart2(point, type)
}

function setActive2(_this){
    $('#salesbtn2 button').removeClass('btn-secondary').addClass('btn-outline-secondary')
    $(_this).addClass('btn-secondary').removeClass('btn-outline-secondary')
}

function renderChart2(endpoint, type = 'bar') {
    Chart.defaults.global.tooltips.callbacks.label = function(tooltipItem, data) {
        var dataset = data.datasets[tooltipItem.datasetIndex]
        var datasetLabel = dataset.label || ''
        return datasetLabel + ": " + Intl.NumberFormat().format(dataset.data[tooltipItem.index]) + ""
    }


    $('.das2').waitMe({
        effect : 'rotation',
        text : 'รอซักครู่'
        });



    $.ajax({  
        type: "GET",  
        url: "service/api/dashboard/" + endpoint
      
    }).done(function(data) {

        $('.das2').waitMe("hide")

        

        label_h = data.response.label_h
        label = data.response.label

        label_1 = data.response.label_1
        label_2 = data.response.label_2
        label_3 = data.response.label_3

        count_man = data.response.count_man
        count_girl = data.response.count_girl
        count_none = data.response.count_none

       

        label_all_hori= data.response.phase_name_all
        // phase_count_1 = data.response.phase_name_count

        // console.log(label_all_hori)


        
     

        const filled_count_man = count_man.map((col_main) => col_main.col_main);
        const dataset_man = label_all_hori.map(col_main => {
        const indexOfFilledData1 = filled_count_man.indexOf(col_main);
            if( indexOfFilledData1!== -1) return count_man[indexOfFilledData1].count_man;
        return '0';
        });

        const filled_count_girl = count_girl.map((col_main) => col_main.col_main);
        const dataset_girl = label_all_hori.map(col_main => {
        const indexOfFilledData2 = filled_count_girl.indexOf(col_main);
            if( indexOfFilledData2!== -1) return count_girl[indexOfFilledData2].count_girl;
        return '0';
        });

        const filled_count_none = count_none.map((col_main) => col_main.col_main);
        const dataset_none = label_all_hori.map(col_main => {
        const indexOfFilledData3 = filled_count_none.indexOf(col_main);
            if( indexOfFilledData3!== -1) return count_none[indexOfFilledData3].count_none;
        return '0';
        });
         
        // console.log(dataset_girl)

        // console.log(label_all_hori)

        // console.log(count_man)
        // console.log(count_girl)
        // console.log(count_none)

        // console.log(dataset_man)
        // console.log(dataset_girl)
        // console.log(dataset_none)


    
        endpoint = endpoint
        type = type

        myChart2 = new Chart($('#visitors-chart2'), {
            type: type,
           
            //value
            data: {
              labels: label_all_hori,
              datasets: [
                {
                label: label_1,
                data: dataset_man,
                backgroundColor: '#14213d'
               },
               {
                label: label_2,
                data: dataset_girl,
                backgroundColor: '#023e8a'
               },
               
               {
                label: label_3,
                data: dataset_none,
                backgroundColor: '#0096c7'
               },
        
            ]
            },
           
            //setting
            options: {
                tooltips: {
                    mode: 'label',
                    callbacks: {
                      footer: (tooltipItems, data) => {
                        let total = tooltipItems.reduce((a, e) => a + parseInt(e.xLabel), 0);
                        return 'รวม: ' + total + ' คน';
                      }
                    }
                  },

                plugins: {
                    datalabels: {
                    display: function(context) {
                        return context.chart.width > 400
                        
                    },
                   
                    borderRadius: 4,
                    color: 'white',
                    font: {
                        weight: 'bold'
                    },
                    formatter:  function(value, context) {
                        return Intl.NumberFormat().format(value)
                    },
                    formatter: function(value, index, values) {
                        if(value >0 ){
                            value = value.toString();
                            value = value.split(/(?=(?:...)*$)/);
                            value = value.join(',');
                            return value;
                        }else{
                            value = "";
                            return value;
                        }
                    }
                  
                    }
                },
                scales: {
                    xAxes: [{
                        ticks: {
                            beginAtZero: true,
                             userCallback: function(label, index, labels) {
                                // when the floored value is the same as the value we have a whole number
                                if (Math.floor(label) === label) {
                                    return label;
                                }
                            },
                        },
                        stacked: true
                    }],
                    yAxes: [{
                        stacked: true
                    }]
                }
            }
        })

        $('#salesTextReport2').text(label_h)
        
    })
}

renderChart2('report-hori-station.php', 'horizontalBar')


      