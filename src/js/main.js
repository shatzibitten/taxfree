$(function() {
    
    var URLS = {
        SAVE_CALC:   "/saveCalc", 
        SAVE_DATA:   "/saveData"
    };


    /**
     Объект calculateCredit имеет два метода:
     differ и annuitet. Первый метод рассчитывает кредит с
     дифференцированными платежами, второй --- с аннуитетными.

     Оба метода принимают три параметра:
     sum (сумма кредита),
     term (срок кредита),
     rate (процентная ставка по кредиту).

     Оба метода возвращают объект, содержащий:
     overpay: переплату по кредиту за весь срок,
     payments: массив, включающий все платежи по кредиту.
     (Метод annuitet возвращает массив, состоящий из
     одного элемента, поскольку все платежи одинаковы).
     total:	общую сумму, которую нужно будет вернуть Банку.
     (с) GuardCat2012
     */

    var calculateCredit = (

        function() {

            var
                errMsg = "Ошибочка. Проверьте введённые цифры",
                wrongResult = {
                    overpay: errMsg,
                    payments: [errMsg],
                    total: errMsg
                }
                ;

            return {

                differ: function(sum, term, rate) {
                    var
                        overpay, payment, count,
                        result = {
                            total: 0,
                            overpay: 0,
                            payments: [ ]
                        }
                        ;

                    for(var x in arguments) {
                        arguments[x] = parseFloat(arguments[x]);
                        if( isNaN( arguments[x] ) ) return wrongResult;
                        if( arguments[x] === 0) arguments[x] = 0.0000000000001;
                    }

                    if(rate) rate = rate / 100 / 12;
                    while(term) {
                        payment = sum / term;
                        overpay =  sum * rate;
                        result.overpay += overpay;
                        count = result.payments.length;
                        result.payments.push( +(payment + overpay ).toFixed( 2 ) );
                        result.total += result.payments[count];
                        term--;
                        sum -= payment;
                    }
                    result.total = result.total.toFixed(2);
                    result.overpay = result.overpay.toFixed(2);
                    return result

                },

                annuitet: function(sum, term, rate) {
                    var
                        koeffAnn  ,
                        result = {
                            total: 0,
                            overpay: 0,
                            payments: [ ]
                        }
                        ;

                    for(var arg in arguments) {
                        arguments[arg] = parseFloat(arguments[arg]);
                        if( isNaN( arguments[arg] ) ) return wrongResult;
                        if( arguments[arg] === 0) arguments[arg] = 0.0000000000001;
                    }

                    if(rate) rate = rate / 100 / 12;
                    koeffAnn = rate * Math.pow( ( 1 + rate ), term ) / (  Math.pow( ( 1 + rate ), term ) - 1 );
                    result.payments.push( ( sum * koeffAnn ).toFixed( 2 ) );
                    result.total = ( result.payments[0] * term ).toFixed( 2 );
                    result.overpay = ( result.total - sum ).toFixed( 2 );

                    return result;
                }
            }//object

        }//anonymous function

    )();
    
    console.log(calculateCredit);
    
    $.fn.serializeObject = function()
    {
        var o = {};
        var a = this.serializeArray();
        $.each(a, function() {
            if (o[this.name] !== undefined) {
                if (!o[this.name].push) {
                    o[this.name] = [o[this.name]];
                }
                o[this.name].push(this.value || '');
            } else {
                o[this.name] = this.value || '';
            }
        });
        return o;
    };

    var getUrlParameter = function getUrlParameter(sParam) {
        var sPageURL = decodeURIComponent(window.location.search.substring(1)),
            sURLVariables = sPageURL.split('&'),
            sParameterName,
            i;

        for (i = 0; i < sURLVariables.length; i++) {
            sParameterName = sURLVariables[i].split('=');

            if (sParameterName[0] === sParam) {
                return sParameterName[1] === undefined ? true : sParameterName[1];
            }
        }
    };


    $("#estate-form-date").mask("00/00/0000");
    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        $("#cash").hide();
        $("#cash-form-sum").val(0);
        $("#estate-form-sum").val(0);
        $("button").prop("disabled", false);
    });

    $("#cash>button").on("click", function(e){
        //e.preventDefault();
        var sum         = $("#cash-form-sum").val();
        var cashType    = $(this).data("cashtype");
        var result      = {};
        
        result.sum          = sum;
        result.cashtype     = cashType; 
        result.userId       = getUrlParameter("id");
        result.type         = $("#cash").data("taxType");
        
        $.ajax({
            method: "POST",
            url:    URLS.SAVE_CALC,
            data:   result 
        });
        console.log("#cash>buttonOnClick -----");
        console.log(result);
        console.log("-------------------");
    });

    $("form[id*='-form'] button").on("click", function(e){
        //e.preventDefault();
        var formName    = $(this).data("formname");
        var $form       = $("#"+formName);
        var jsonObject  = $form.serializeObject();
        var userId      = getUrlParameter("id");
        
        //устанавливаем вид вычета (estate-form, edu-form, med-form)
        jsonObject.type     = formName;
        //идентификатор пользователя берется из URL 
        jsonObject.userId   = userId;
        
        console.log("form buttonOnClick -----");
        console.log(jsonObject);
        console.log("-------------------");
        
        $.ajax({
                method: "POST",
                url:    URLS.SAVE_DATA,
                data:   jsonObject
        }).done(function() {

                //перенести в .done()
                $("#cash").show();
                //сохраняем вид вычета
                $("#cash").data("taxType",formName);
                var sal          = $("#"+formName+"-sal").val();
                var taxDeduction = $("#"+formName+"-sum").val();

                if (formName == "estate-form") {
                    console.log("___________");
                    var yearsReg = /\d+\s*(лет|год)/;
                    var term = $("#estate-form-years").val();
                    var monthsReg = /\d+\s*(мес|месяц)/;
                    var txt;

                    //Нормализация полей
                    txt = term;
                    term.replace( /,\d{0,}|\.\d{0,}/g, "" );
                    if ( yearsReg.test( term ) )  {
                        term = parseInt( term.match( yearsReg )[0] ) * 12;
                        if ( monthsReg.test( txt ) ) {
                            txt = parseInt( txt.match( monthsReg )[0] )
                        } else {
                            txt = "0";
                        }
                        term = +term + parseInt(txt);
                    }

                    console.log(calculateCredit.differ($("#estate-form-sum").val(), term, $("#estate-form-percent").val() ));

                    var sumPmnts = 0;
                    var elmt = calculateCredit.differ($("#estate-form-sum").val(), term, $("#estate-form-percent").val() ).payments;
                    for( var i = 0; i < elmt.length; i++ ){
                        sumPmnts += parseInt( elmt[i], 10 ); //don't forget to add the base
                    }
                    var avg = sumPmnts/elmt.length;
                    console.log("AVG - " + avg);
                    taxDeduction = avg;
                }

                var taxBase = sal-(sal*10/100)-22859;
                var ipnRaw     = (taxBase*10/100);

                var withTaxDeduction = sal-(sal*10/100)-taxDeduction-22859;
                var ipnWithDeduction = withTaxDeduction*10/100;
                if (ipnWithDeduction < 0) {
                    var monthRevenue    = ipnRaw;
                } else {
                    var monthRevenue    = ipnRaw-ipnWithDeduction;
                }

                var yearRevenue     = monthRevenue*12;
                var res             = 0;
                console.log("raw ipn - ", ipnRaw);
                console.log("ipn with deduction", ipnWithDeduction);

                if (formName === "estate-form") {
                    var termYear = $("#estate-form-date").val().split("/")[2];
                    var currYear = new Date().getFullYear();
                    var yearDiff = currYear-termYear;

                    if (yearDiff>5) {
                        yearDiff = 5;
                    }

                    if (yearDiff<1) {
                        yearDiff = 1;
                    }
                    console.log("GOD " + yearDiff);
                    yearRevenue = yearDiff*yearRevenue;

                }



                res = yearRevenue > 1000000 ? 1000000 : yearRevenue;
                if (res < 0) {
                    res = "К сожалению мы не сможем вам помочь. Указан слишком маленький размер оклада";
                    $("button").prop("disabled", true);
                } else {
                    res += " тенге";
                }
                $("#sum").html(res);
                $("#cash-form-sum").val(res);            
        })
        .fail(function(er) {
                console.log(er);
                $("#sum").html("Заполните форму или обратитесь к администратору!");
                //$("#cash-form-sum").val(res);
        })
        .always(function() {
        });
    });
});

