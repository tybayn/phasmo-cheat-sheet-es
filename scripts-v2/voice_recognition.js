const levenshtein_distance = (str1 = '', str2 = '') => {
    const track = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null));
    for (let i = 0; i <= str1.length; i += 1) {
       track[0][i] = i;
    }
    for (let j = 0; j <= str2.length; j += 1) {
       track[j][0] = j;
    }
    for (let j = 1; j <= str2.length; j += 1) {
       for (let i = 1; i <= str1.length; i += 1) {
          const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
          track[j][i] = Math.min(
             track[j][i - 1] + 1,
             track[j - 1][i] + 1,
             track[j - 1][i - 1] + indicator,
          );
       }
    }
    return track[str2.length][str1.length];
 };

 let running_log = []

 $.fn.isInViewport = function () {
    let elementTop = $(this).offset().top;
    let elementBottom = elementTop + $(this).outerHeight();
  
    let viewportTop = $(window).scrollTop();
    let viewportBottom = viewportTop + window.innerHeight;
  
    return elementBottom > viewportTop && elementTop < viewportBottom;
}

function reset_voice_status(){
    setTimeout(function(){
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic.png)";
        document.getElementById("voice_recognition_status").className = "pulse_animation"
    },1000)
}

function domovoi_show_last(){
    $("#domovoi-text").show()
    $("#domovoi-img").attr("src","imgs/domovoi-heard.png")
}

function domovoi_hide_last(){
    $("#domovoi-text").hide()
    $("#domovoi-img").attr("src","imgs/domovoi.png")
}


function domovoi_heard(message){
    $("#domovoi-text").text(message.toLowerCase())
    $("#domovoi-text").show()
    $("#domovoi-img").attr("src","imgs/domovoi-heard.png")
    setTimeout(function() {
        $("#domovoi-text").hide()
        $("#domovoi-img").attr("src",markedDead ? "imgs/domovoi-died.png" : "imgs/domovoi.png")
    },2000)
}

function domovoi_not_heard(){
    $("#domovoi-img").attr("src",user_settings['domo_side'] == 1 ? "imgs/domovoi-guess-flip.png" : "imgs/domovoi-guess.png")
    setTimeout(function() {
        $("#domovoi-img").attr("src",markedDead ? "imgs/domovoi-died.png" : "imgs/domovoi.png")
    },3000)
}

function domovoi_print_logs(){
    console.log("----------------------------------------------------------------")
    console.log("Domo memory:")
    running_log.forEach(function (item,idx){
        console.log(`--${idx}--`)
        for (const [key, value] of Object.entries(item)) {
            console.log(`${key}: ${value}`)
        }
    })
    console.log("----------------------------------------------------------------")
}

function parse_speech(vtext){
    vtext = vtext.toLowerCase().trim()
    running_log.push({
        "Time":new Date().toJSON().replace('T', ' ').split('.')[0],
        "Raw":vtext
    })
    if(running_log.length > 5){
        running_log.shift()
    }
    let cur_idx = running_log.length - 1

    domovoi_msg = ""

    for (const [key, value] of Object.entries(ZNLANG['overall'])) {
        for (var i = 0; i < value.length; i++) {
            vtext = vtext.replace(value[i], key);
        }
    }

    running_log[cur_idx]["Cleaned"] = vtext

    if(vtext.startsWith('velocidad fantasma')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized velocidad fantasma command")
        running_log[cur_idx]["Type"] = "velocidad fantasma"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('velocidad fantasma', "").trim()
        domovoi_msg += "marcar la velocidad del fantasma a "

        vtext = vtext.replace('tres','3')
        vtext = vtext.replace('dos','2')
        vtext = vtext.replace('uno','1').replace('un','1')
        vtext = vtext.replace('zero','0').replace('cero','0')

        var smallest_num = '150'
        var smallest_val = 100
        var prev_value = document.getElementById("ghost_modifier_speed").value
        var all_ghost_speed = ['50','75','100','125','150']
        var all_ghost_speed_convert = {'50':0,'75':1,'100':2,'125':3,'150':4}

        for(var i = 0; i < all_ghost_speed.length; i++){
            var leven_val = levenshtein_distance(all_ghost_speed[i],vtext)
            if(leven_val < smallest_val){
                smallest_val = leven_val 
                smallest_num = all_ghost_speed[i]
            }
        }
        domovoi_msg += smallest_num

        document.getElementById("ghost_modifier_speed").value = all_ghost_speed_convert[smallest_num] ?? 2

        if(prev_value != all_ghost_speed_convert[smallest_num]){
            setTempo();
            bpm_calc(true);
            saveSettings();
            send_state()
        }

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.includes('fantasma')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized fantasma command")
        running_log[cur_idx]["Type"] = "fantasma"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('fantasma ', "").trim()
        domovoi_msg += "marcado "

        var smallest_ghost = "Spirit"
        var smallest_val = 100
        var vvalue = 0
        if(vtext.startsWith("negativo ") || vtext.startsWith("negativa ")){
            vtext = vtext.replace('negativo ', "").replace('negativa ', "").trim()
            vvalue = 0
            domovoi_msg = "no marcado "
        }
        else if(vtext.startsWith("limpiar ")){
            vtext = vtext.replace('limpiar ', "").trim()
            vvalue = 0
            domovoi_msg = "cleared "
        }
        else if(vtext.startsWith("seleccionar ")){
            vtext = vtext.replace('seleccionar ', "").trim()
            vvalue = 2
            domovoi_msg = "seleccionado "
        }
        else if(vtext.startsWith("remover ")){
            vtext = vtext.replace('remover ', "").trim()
            vvalue = -1
            domovoi_msg = "descartado "
        }
        else if(vtext.startsWith("mostrar info ") || vtext.startsWith("info ")){
            vtext = vtext.replace('mostrar info ', "").replace('info ', "").trim()
            vvalue = -10
            domovoi_msg = "mostrando informacion de "
        }

        // Common fixes to ghosts
        var prevtext = vtext;
        for (const [key, value] of Object.entries(ZNLANG['ghosts'])) {
            for (var i = 0; i < value.length; i++) {
                if(vtext.startsWith(value[i])){vtext = key}
            }
        }

        for(var i = 0; i < Object.keys(all_ghosts).length; i++){
            var leven_val = levenshtein_distance(Object.values(all_ghosts)[i].toLowerCase(),vtext)
            if(leven_val < smallest_val){
                smallest_val = leven_val 
                smallest_ghost = Object.values(all_ghosts)[i]
            }
        }
        console.log(`${prevtext} >> ${vtext} >> ${smallest_ghost}`)
        running_log[cur_idx]["Debug"] = `${prevtext} >> ${vtext} >> ${smallest_ghost}`
        domovoi_msg += smallest_ghost

        if (vvalue == 0){
            fade(document.getElementById(rev(all_ghosts,smallest_ghost)));
        }
        else if (vvalue == 3){
            guess(document.getElementById(rev(all_ghosts,smallest_ghost)));
            if(!$(document.getElementById(rev(all_ghosts,smallest_ghost))).isInViewport())
                document.getElementById(rev(all_ghosts,smallest_ghost)).scrollIntoView({alignToTop:true,behavior:"smooth"})
        }
        else if (vvalue == 2){
            select(document.getElementById(rev(all_ghosts,smallest_ghost)));
            if(!$(document.getElementById(rev(all_ghosts,smallest_ghost))).isInViewport())
                document.getElementById(rev(all_ghosts,smallest_ghost)).scrollIntoView({alignToTop:true,behavior:"smooth"})
        }
        else if (vvalue == -1){
            remove(document.getElementById(rev(all_ghosts,smallest_ghost)));
        }
        else if (vvalue == -2){
            died(document.getElementById(rev(all_ghosts,smallest_ghost)));
            if(!$(document.getElementById(rev(all_ghosts,smallest_ghost))).isInViewport())
                document.getElementById(rev(all_ghosts,smallest_ghost)).scrollIntoView({alignToTop:true,behavior:"smooth"})
        }
        else if(vvalue == -10){
            if(!$(document.getElementById(rev(all_ghosts,smallest_ghost))).isInViewport())
                document.getElementById(rev(all_ghosts,smallest_ghost)).scrollIntoView({alignToTop:true,behavior:"smooth"})
            send_ghost_data_link(smallest_ghost)
        }

        resetResetButton()
        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.includes('evidencia') || vtext.includes('evidencias')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized evidencia command")
        running_log[cur_idx]["Type"] = "evidencia"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('evidencias', "").replace('evidencia', "").trim()
        domovoi_msg += "evidencia marcada como "

        var smallest_evidence = "emf 5"
        var smallest_val = 100
        var vvalue = 1
        if(vtext.startsWith("negativo ") || vtext.startsWith("negativa ")){
            vtext = vtext.replace('negativo ', "").replace('negativa ', "").trim()
            vvalue = -1
            domovoi_msg = "evidencia no marcada como "
        }
        else if(vtext.startsWith("limpiar ")){
            vtext = vtext.replace('limpiar ', "").trim()
            vvalue = 0
            domovoi_msg = "despejada "
        }

        // Common replacements for evidence names
        var prevtext = vtext;
        vtext = vtext.replace("ghost ","").trim()
        for (const [key, value] of Object.entries(ZNLANG['evidence'])) {
            for (var i = 0; i < value.length; i++) {
                if(vtext.startsWith(value[i])){vtext = key}
            }
        }


        for(var i = 0; i < Object.keys(all_evidence).length; i++){
            var leven_val = levenshtein_distance(Object.values(all_evidence)[i].toLowerCase(),vtext)
            if(leven_val < smallest_val){
                smallest_val = leven_val 
                smallest_evidence = Object.values(all_evidence)[i]
            }
        }
        console.log(`${prevtext} >> ${vtext} >> ${smallest_evidence}`)
        running_log[cur_idx]["Debug"] = `${prevtext} >> ${vtext} >> ${smallest_evidence}`
        domovoi_msg += smallest_evidence

        if(!$(document.getElementById(rev(all_evidence,smallest_evidence)).querySelector("#checkbox")).hasClass("block")){
            while (vvalue != {"good":1,"bad":-1,"neutral":0}[document.getElementById(rev(all_evidence,smallest_evidence)).querySelector("#checkbox").classList[0]]){
                tristate(document.getElementById(rev(all_evidence,smallest_evidence)));
            }
        }
        else{
            domovoi_msg = `¡Evidencia ${smallest_evidence} esta bloqueada!`
        }
        

        resetResetButton()
        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()

    }
    else if(vtext.startsWith('mano de mono')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized mano de mono command")
        running_log[cur_idx]["Type"] = "mano de mono"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('mano de mono', "").trim()
        domovoi_msg += "marcada "

        var smallest_evidence = "emf 5"
        var smallest_val = 100
        var vvalue = 1

        // Common replacements for evidence names
        var prevtext = vtext;
        for (const [key, value] of Object.entries(ZNLANG['evidence'])) {
            for (var i = 0; i < value.length; i++) {
                if(vtext.startsWith(value[i])){vtext = key}
            }
        }


        for(var i = 0; i < Object.keys(all_evidence).length; i++){
            var leven_val = levenshtein_distance(Object.values(all_evidence)[i].toLowerCase(),vtext)
            if(leven_val < smallest_val){
                smallest_val = leven_val 
                smallest_evidence = Object.values(all_evidence)[i]
            }
        }
        console.log(`${prevtext} >> ${vtext} >> ${smallest_evidence}`)
        running_log[cur_idx]["Debug"] = `${prevtext} >> ${vtext} >> ${smallest_evidence}`
        domovoi_msg += `${smallest_evidence} como evidencia de mano de mono`

        monkeyPawFilter($(document.getElementById(rev(all_evidence,smallest_evidence))).parent().find(".monkey-paw-select"))

        resetResetButton()
        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()

    }
    else if(vtext.includes('velocidad')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized velocidad command")
        running_log[cur_idx]["Type"] = "velocidad"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('velocidad', "").trim()
        domovoi_msg += "velocidad marcada "

        var smallest_speed = "normal"
        var smallest_val = 100
        var vvalue = 1
        if(vtext.startsWith("negativo ")|| vtext.startsWith("negativa ")){
            vtext = vtext.replace('negativo ', "").replace('negativa ', "").trim()
            vvalue = 0
            domovoi_msg = "velocidad marcada no "
        }
        else if(vtext.startsWith("limpiar ")){
            vtext = vtext.replace('limpiar ', "").trim()
            vvalue = -1
            domovoi_msg = "despejado "
        }

        vtext = vtext.replace("tiene ","")
        if (vtext.startsWith("linea de vision")){
            console.log(`${vtext} >> linea de vision`)
            running_log[cur_idx]["Debug"] = `${vtext} >> linea de vision`

            if((vvalue==0 && all_los()) || (vvalue==1 && all_not_los())){
                domovoi_msg = `${vvalue == 0 ? '¡Todos los fantasmas actuales tienen' : '¡Ningún fantasma actual tiene'} línea de visión!`
            }
            else{
                while (!$(document.getElementById("LOS").querySelector("#checkbox")).hasClass(["neutral","bad","good"][vvalue+1])){
                    tristate(document.getElementById("LOS"));
                }
                domovoi_msg = `${vvalue == -1 ? 'linea de vision despejada' : vvalue == 0 ? 'marcada como negativa la linea de vision' : 'marcada linea de vision'}`
            }
        }
        else{

            if (vvalue == -1){
                vvalue = 0
            }

            // Common replacements for speed
            var prevtext = vtext;
            for (const [key, value] of Object.entries(ZNLANG['speed'])) {
                for (var i = 0; i < value.length; i++) {
                    if(vtext.startsWith(value[i])){vtext = key}
                }
            }

            for(var i = 0; i < Object.keys(all_speed).length; i++){
                var leven_val = levenshtein_distance(Object.values(all_speed)[i].toLowerCase(),vtext)
                if(leven_val < smallest_val){
                    smallest_val = leven_val 
                    smallest_speed = Object.values(all_speed)[i]
                }
            }
            console.log(`${prevtext} >> ${vtext} >> ${smallest_speed}`)
            running_log[cur_idx]["Debug"] = `${prevtext} >> ${vtext} >> ${smallest_speed}`
            domovoi_msg += smallest_speed

            if(!$(document.getElementById(rev(all_speed,smallest_speed)).querySelector("#checkbox")).hasClass("block")){
                while (vvalue != {"good":1,"neutral":0}[document.getElementById(rev(all_speed,smallest_speed)).querySelector("#checkbox").classList[0]]){
                    dualstate(document.getElementById(rev(all_speed,smallest_speed)));
                }
            }
            else{
                domovoi_msg = `¡Velocidad ${smallest_speed} esta bloqueada!`
            }
        }
        
        resetResetButton()
        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()

    }
    else if(vtext.includes('cordura')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized cordura command")
        running_log[cur_idx]["Type"] = "cordura"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('cordura', "").trim()
        domovoi_msg += "marcar cordura de la caza "

        var smallest_sanity = "Late"
        var smallest_val = 100
        var vvalue = 1
        if(vtext.startsWith("negativo ") || vtext.startsWith("negativa ")){
            vtext = vtext.replace('negativo ', "").replace('negativa ', "").trim()
            vvalue = 0
            domovoi_msg = "marcar caza cordura no "
        }
        else if(vtext.startsWith("limpiar ")){
            vtext = vtext.replace('limpiar ', "").trim()
            vvalue = 0
            domovoi_msg = "despejar "
        }

        // Common replacements for sanity
        var prevtext = vtext;
        for (const [key, value] of Object.entries(ZNLANG['sanity'])) {
            for (var i = 0; i < value.length; i++) {
                if(vtext.startsWith(value[i])){vtext = key}
            }
        }

        for(var i = 0; i < Object.keys(all_sanity).length; i++){
            var leven_val = levenshtein_distance(Object.values(all_sanity)[i].toLowerCase(),vtext)
            if(leven_val < smallest_val){
                smallest_val = leven_val 
                smallest_sanity = Object.values(all_sanity)[i]
            }
        }
        console.log(`${prevtext} >> ${vtext} >> ${smallest_sanity}`)
        running_log[cur_idx]["Debug"] = `${prevtext} >> ${vtext} >> ${smallest_sanity}`
        domovoi_msg += smallest_sanity.replace("Average","Normal")

        if(!$(document.getElementById(rev(all_sanity,smallest_sanity)).querySelector("#checkbox")).hasClass("block")){
            while (vvalue != {"good":1,"neutral":0}[document.getElementById(rev(all_sanity,smallest_sanity)).querySelector("#checkbox").classList[0]]){
                dualstate(document.getElementById(rev(all_sanity,smallest_sanity)),false,true);
            }
        }
        else{
            domovoi_msg = `¡Cordura ${smallest_sanity} esta bloqueada!`
        }

        resetResetButton()
        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()

    }
    else if(vtext.endsWith('temporizador')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized temporizador command")
        running_log[cur_idx]["Type"] = "temporizador"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('temporizador', "").trim()
        

        if(vtext == "inicio"){
            domovoi_msg += "inicio del temporizador del incienso"
            toggle_timer(true,false)
            send_timer(true,false)
        } 
        else{
            domovoi_msg += "temporizador del inicienso detenida"
            toggle_timer(false,true)
            send_timer(false,true)
        }
        

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.endsWith('espere')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized espere command")
        running_log[cur_idx]["Type"] = "espere"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('espere', "").trim()
        
        if(vtext == "inicio"){
            domovoi_msg += "inicio del temporizador del tiempo de espere "
            toggle_cooldown_timer(true,false)
            send_cooldown_timer(true,false)
        } 
        else{
            domovoi_msg += "temporizador del tiempo de espere detenida"
            toggle_cooldown_timer(false,true)
            send_cooldown_timer(false,true)
        }

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.endsWith('cazar')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized cazar command")
        running_log[cur_idx]["Type"] = "cazar"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('cazar', "").trim()
        
        if(vtext == "inicio"){
            domovoi_msg += "inicio del temporizador del tiempo de cazar "
            toggle_cooldown_timer(true,false)
            send_cooldown_timer(true,false)
        } 
        else{
            domovoi_msg += "temporizador del tiempo de cazar detenida"
            toggle_cooldown_timer(false,true)
            send_cooldown_timer(false,true)
        }

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('duración de la caza')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized hunt duration set command")
        running_log[cur_idx]["Type"] = "hunt duration set"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('duración de la caza ', "").trim()
        domovoi_msg += "ajustar la duración de la caza a "

        if(document.getElementById("num_evidence").value == "-1"){

            var smallest_num = "3"
            var smallest_val = 100
            var prev_value = document.getElementById("cust_hunt_length").value
            var all_hunt_length = ["corto","bajo","medio","largo","alto"]

            for(var i = 0; i < all_hunt_length.length; i++){
                var leven_val = levenshtein_distance(all_hunt_length[i],vtext)
                if(leven_val < smallest_val){
                    smallest_val = leven_val 
                    smallest_num = all_hunt_length[i]
                }
            }
            domovoi_msg += smallest_num

            smallest_num = {"corto":"3A","bajo":"3A","medio":"3I","largo":"3","alto":"3"}[smallest_num]
            document.getElementById("cust_hunt_length").value = smallest_num
            if(prev_value != smallest_num){
                filter()
                updateMapDifficulty(smallest_num)
                saveSettings()
            }
        }
        else{
            domovoi_msg = "dificultad personalizada no seleccionada"
        }

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('numero de evidencias')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized numero de evidencias command")
        running_log[cur_idx]["Type"] = "numero de evidencias"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('numero de evidencias', "").trim()
        domovoi_msg += "colocar # de evidencia a "

        vtext = vtext.replace('tres','3')
        vtext = vtext.replace('dos','2')
        vtext = vtext.replace('uno','1').replace('un','1')
        vtext = vtext.replace('zero','0').replace('cero','0')

        if(document.getElementById("num_evidence").value == "-1"){
            var smallest_num = 3
            var smallest_val = 100
            var prev_value = document.getElementById("cust_num_evidence").value
            var all_difficulty = ['0','1','2','3']

            for(var i = 0; i < all_difficulty.length; i++){
                var leven_val = levenshtein_distance(all_difficulty[i],vtext)
                if(leven_val < smallest_val){
                    smallest_val = leven_val 
                    smallest_num = all_difficulty[i]
                }
            }
            domovoi_msg += smallest_num

            document.getElementById("cust_num_evidence").value = smallest_num ?? 3
            if(prev_value != smallest_num){
                filter()
                flashMode()
                saveSettings()
            }
        }
        else{
            domovoi_msg = "dificultad personalizada no seleccionada"
        }

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('dificultad')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized dificultad command")
        running_log[cur_idx]["Type"] = "dificultad"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('dificultad', "").trim()
        domovoi_msg += "ajustar dificultad a "

        var smallest_num = '3'
        var smallest_val = 100
        var prev_value = document.getElementById("num_evidence").value
        var all_difficulty = ["personalizada","apocalipsis","demencia","pesadilla","profesional","intermedia","principiante"]

        for(var i = 0; i < all_difficulty.length; i++){
            var leven_val = levenshtein_distance(all_difficulty[i],vtext)
            if(leven_val < smallest_val){
                smallest_val = leven_val 
                smallest_num = all_difficulty[i]
            }
        }
        domovoi_msg += smallest_num

        smallest_num = {"personalizada":"-1","apocalipsis":"0","demencia":"1","pesadilla":"2","profesional":"3","intermedia":"3I","principiante":"3A"}[smallest_num]
        document.getElementById("num_evidence").value = smallest_num ?? 3
        if(prev_value != smallest_num){
            filter()
            updateMapDifficulty(smallest_num)
            showCustom()
            flashMode()
            setGhostSpeedFromDifficulty(smallest_num)
            bpm_calc(true)
            saveSettings()
        }

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('mostrar herramientas') || vtext.startsWith('mostrar filtros')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized filtros/herramientas command")
        running_log[cur_idx]["Type"] = "filtros/herramientas"
        console.log(`Heard '${vtext}'`)
        domovoi_msg += "menu colocado"

        toggleFilterTools()

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('seleccionar mapa')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized mapa command")
        running_log[cur_idx]["Type"] = "mapa"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('seleccionar mapa', "").trim()
        domovoi_msg = "mapa seleccionado"

        var smallest_map = "tanglewood"
        var smallest_val = 100

        if(vtext != ""){

            // Common replacements for maps
            var prevtext = vtext;
            for (const [key, value] of Object.entries(ZNLANG['maps'])) {
                for (var i = 0; i < value.length; i++) {
                    if(vtext.includes(value[i])){vtext = vtext.replace(value[i],key)}
                }
            }

            var maps = document.getElementsByClassName("maps_button")

            for(var i = 0; i < maps.length; i++){
                var leven_val = levenshtein_distance(maps[i].id.toLowerCase(),vtext)
                if(leven_val < smallest_val){
                    smallest_val = leven_val 
                    smallest_map = maps[i].id
                }
            }
            console.log(`${prevtext} >> ${vtext} >> ${smallest_map}`)
            running_log[cur_idx]["Debug"] = `${prevtext} >> ${vtext} >> ${smallest_map}`
            domovoi_msg += `: ${smallest_map}`
        }

        changeMap(document.getElementById(smallest_map),all_maps[smallest_map])

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('mostrar mapa')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized mapa command")
        running_log[cur_idx]["Type"] = "mapa"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('mostrar mapa', "").trim()
        domovoi_msg = "mostrando mapa"

        var smallest_map = "tanglewood"
        var smallest_val = 100

        if(vtext != ""){

            // Common replacements for maps
            var prevtext = vtext;
            for (const [key, value] of Object.entries(ZNLANG['maps'])) {
                for (var i = 0; i < value.length; i++) {
                    if(vtext.includes(value[i])){vtext = vtext.replace(value[i],key)}
                }
            }

            var maps = document.getElementsByClassName("maps_button")

            for(var i = 0; i < maps.length; i++){
                var leven_val = levenshtein_distance(maps[i].id.toLowerCase(),vtext)
                if(leven_val < smallest_val){
                    smallest_val = leven_val 
                    smallest_map = maps[i].id
                }
            }
            console.log(`${prevtext} >> ${vtext} >> ${smallest_map}`)
            running_log[cur_idx]["Debug"] = `${prevtext} >> ${vtext} >> ${smallest_map}`
            domovoi_msg += `: ${smallest_map}`

            changeMap(document.getElementById(smallest_map),all_maps[smallest_map])
        }

        showMaps(true,false)

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('cerrar mapa') || vtext.startsWith('ocultar mapa')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized mapa command")
        running_log[cur_idx]["Type"] = "mapa"
        console.log(`Heard '${vtext}'`)
        domovoi_msg = "cerrando mappa"

        showMaps(false, true)

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('resetear guia') || vtext.startsWith('resetear jornada')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized resetear command")
        console.log(`Heard '${vtext}'`)
        reset()
    }
    else if(vtext.startsWith('detener reconocimiento')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized detener reconocimiento command")
        console.log(`Heard '${vtext}'`)
        stop_voice()
    }
    else if(
        vtext.startsWith("hola domo") || vtext.startsWith("hola domovoi")|| vtext.startsWith("hola zero")
    ){
        if(Object.keys(discord_user).length > 0){
            domovoi_heard(`¡Hola ${discord_user['username']}!`)
        }
        else{
            domovoi_heard("¡Hola!")
        }
        
        reset_voice_status()
    }
    else if(
        vtext.startsWith("mover domo") || vtext.startsWith("mover domovoi")|| vtext.startsWith("mover zero") ||
        vtext.startsWith("domo mover") || vtext.startsWith("domovoi mover")|| vtext.startsWith("zero mover")
    ){
        if (user_settings['domo_side'] == 0){
            $("#domovoi").addClass("domovoi-flip")
            $("#domovoi-img").addClass("domovoi-img-flip")
        }
        else{
            $("#domovoi").removeClass("domovoi-flip")
            $("#domovoi-img").removeClass("domovoi-img-flip")
        }
        saveSettings()
        
        reset_voice_status()
    }
    else{
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-not-recognized.png)"
        domovoi_not_heard()
        reset_voice_status()
    }


}

if (("webkitSpeechRecognition" in window || "speechRecognition" in window) && !navigator.userAgent.toLowerCase().match(/firefox|fxios|opr/) && !('brave' in navigator)) {
    let speechRecognition = new webkitSpeechRecognition() || new speechRecognition();
    let stop_listen = true
  
    speechRecognition.continuous = false;
    speechRecognition.interimResults = false;
    speechRecognition.lang = 'es';
  
    speechRecognition.onend = () => {
        if(!stop_listen){
            speechRecognition.start(auto=true);
        }
    }

    speechRecognition.onspeechstart = () =>{
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-listening.png)"
    }

    speechRecognition.onerror = (error) =>{
        if(error.error != "no-speech")
            console.log(error)
    }
  
    speechRecognition.onresult = (event) => {
        let final_transcript = "";
  
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                final_transcript = event.results[i][0].transcript;
            }
        }

        final_transcript = final_transcript.replace(/[.,;:-]/g, '')
        parse_speech(final_transcript);
    };
    
    function start_voice(auto=false){
        stop_listen = false
        if(!auto){
            document.getElementById("start_voice").disabled = true
            document.getElementById("stop_voice").disabled = false
            document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic.png)";
            document.getElementById("voice_recognition_status").className = "pulse_animation"
            document.getElementById("voice_recognition_status").style.display = "block"
            $("#domovoi").show()
            setCookie("voice_recognition_on",true,0.0833)
        }
        speechRecognition.start();
    }

    function stop_voice(){
        stop_listen = true
        document.getElementById("start_voice").disabled = false
        document.getElementById("stop_voice").disabled = true
        document.getElementById("voice_recognition_status").style.display = "none"
        setCookie("voice_recognition_on",false,-1)
        $("#domovoi").hide()
        speechRecognition.stop();
    }

  } else {
    document.getElementById("start_voice").disabled = true
    document.getElementById("stop_voice").disabled = true
    document.getElementById("start_voice").style.display = "none"
    document.getElementById("stop_voice").style.display = "none"
    document.getElementById("voice_recognition_note").innerHTML = "Navegador no compatible"
    console.log("Reconocimiento de voz no disponible");
  }

