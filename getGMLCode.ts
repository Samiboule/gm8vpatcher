import path from "path"
import { GMObject } from "./asset/object"

export class GMLCode {
	public static getWorldCreate(ID: string, gameName: string, server: string, ports: {tcp: number, udp: number}): string {
		return `
		/// ONLINE
		__ONLINE_connected = false;
		__ONLINE_buffer = buffer_create();
		__ONLINE_selfID = "";
		__ONLINE_name = "";
		__ONLINE_selfGameID = "${ID}";
		__ONLINE_server = "${server}";
		if(file_exists("tempOnline")){
		buffer_read_from_file(__ONLINE_buffer, "tempOnline");
		__ONLINE_socket = buffer_read_uint16(__ONLINE_buffer);
		__ONLINE_udpsocket = buffer_read_uint16(__ONLINE_buffer);
		__ONLINE_selfID = buffer_read_string(__ONLINE_buffer);
		__ONLINE_name = buffer_read_string(__ONLINE_buffer);
		__ONLINE_n = buffer_read_uint16(__ONLINE_buffer);
		for(__ONLINE_i = 0; __ONLINE_i < __ONLINE_n; __ONLINE_i += 1){
		__ONLINE_oPlayer = instance_create(0, 0, __ONLINE_onlinePlayer);
		__ONLINE_oPlayer.__ONLINE_ID = buffer_read_string(__ONLINE_buffer);
		__ONLINE_oPlayer.x = buffer_read_int32(__ONLINE_buffer);
		__ONLINE_oPlayer.y = buffer_read_int32(__ONLINE_buffer);
		__ONLINE_oPlayer.sprite_index = buffer_read_int32(__ONLINE_buffer);
		__ONLINE_oPlayer.image_speed = buffer_read_float32(__ONLINE_buffer);
		__ONLINE_oPlayer.image_xscale = buffer_read_float32(__ONLINE_buffer);
		__ONLINE_oPlayer.image_yscale = buffer_read_float32(__ONLINE_buffer);
		__ONLINE_oPlayer.image_angle = buffer_read_float32(__ONLINE_buffer);
		__ONLINE_oPlayer.__ONLINE_oRoom = buffer_read_uint16(__ONLINE_buffer);
		__ONLINE_oPlayer.__ONLINE_name = buffer_read_string(__ONLINE_buffer);
		}
		}else{
		__ONLINE_socket = socket_create();
		socket_connect(__ONLINE_socket, __ONLINE_server, ${ports.tcp});
		__ONLINE_name = wd_input_box("Name", "Enter your name:", "");
		if(__ONLINE_name == ""){
		__ONLINE_name = "Anonymous";
		}
		__ONLINE_name = string_replace_all(__ONLINE_name, "#", "\\#");
		if(string_length(__ONLINE_name) > 20){
		__ONLINE_name = string_copy(__ONLINE_name, 0, 20);
		}
		buffer_clear(__ONLINE_buffer);
		buffer_write_uint8(__ONLINE_buffer, 3);
		buffer_write_string(__ONLINE_buffer, __ONLINE_name);
		buffer_write_string(__ONLINE_buffer, __ONLINE_selfGameID);
		buffer_write_string(__ONLINE_buffer, "${gameName}");
		socket_write_message(__ONLINE_socket, __ONLINE_buffer);
		__ONLINE_udpsocket = udpsocket_create();
		udpsocket_start(__ONLINE_udpsocket, false, 0);
		udpsocket_set_destination(__ONLINE_udpsocket, __ONLINE_server, ${ports.udp});
		buffer_clear(__ONLINE_buffer);
		buffer_write_uint8(__ONLINE_buffer, 0);
		udpsocket_send(__ONLINE_udpsocket, __ONLINE_buffer);
		}
		__ONLINE_pExists = false;
		__ONLINE_pX = 0;
		__ONLINE_pY = 0;
		__ONLINE_t = 0;
		`;
	}
	public static getWorldEndStep = function(player: GMObject, player2: GMObject): string {
		return `
		/// ONLINE
		/// TCP SOCKETS
		socket_update_read(__ONLINE_socket);
		while(socket_read_message(__ONLINE_socket, __ONLINE_buffer)){
		switch(buffer_read_uint8(__ONLINE_buffer)){
		case 0:
		// CREATED
		__ONLINE_ID = buffer_read_string(__ONLINE_buffer);
		__ONLINE_found = false;
		for(__ONLINE_i = 0; __ONLINE_i < instance_number(__ONLINE_onlinePlayer); __ONLINE_i += 1){
		if(instance_find(__ONLINE_onlinePlayer, __ONLINE_i).__ONLINE_ID == __ONLINE_ID){
		__ONLINE_found = true;
		break;
		}
		}
		if(!__ONLINE_found){
		__ONLINE_oPlayer = instance_create(0, 0, __ONLINE_onlinePlayer);
		__ONLINE_oPlayer.__ONLINE_ID = __ONLINE_ID;
		__ONLINE_oPlayer.__ONLINE_name = buffer_read_string(__ONLINE_buffer);;
		}
		break;
		case 1:
		// DESTROYED
		__ONLINE_ID = buffer_read_string(__ONLINE_buffer);
		for(__ONLINE_i = 0; __ONLINE_i < instance_number(__ONLINE_onlinePlayer); __ONLINE_i += 1){
		__ONLINE_oPlayer = instance_find(__ONLINE_onlinePlayer, __ONLINE_i);
		if(__ONLINE_oPlayer.__ONLINE_ID == __ONLINE_ID){
		with(__ONLINE_oPlayer){
		instance_destroy();
		}
		break;
		}
		}
		break;
		case 4:
		// CHAT MESSAGE
		__ONLINE_ID = buffer_read_string(__ONLINE_buffer);
		__ONLINE_found = false;
		__ONLINE_oPlayer = 0;
		for(__ONLINE_i = 0; __ONLINE_i < instance_number(__ONLINE_onlinePlayer); __ONLINE_i += 1){
		__ONLINE_oPlayer = instance_find(__ONLINE_onlinePlayer, __ONLINE_i);
		if(__ONLINE_oPlayer.__ONLINE_ID == __ONLINE_ID){
		__ONLINE_found = true;
		break;
		}
		}
		if(__ONLINE_found){
		__ONLINE_message = buffer_read_string(__ONLINE_buffer);
		__ONLINE_oChatbox = instance_create(0, 0, __ONLINE_chatbox);
		__ONLINE_oChatbox.__ONLINE_message = __ONLINE_message;
		__ONLINE_oChatbox.__ONLINE_follower = __ONLINE_oPlayer;
		if(__ONLINE_oPlayer.visible){
		sound_play(__ONLINE_sndChatbox);
		}
		}
		break;
		case 5:
		// SOMEONE SAVED
		__ONLINE_sGravity = buffer_read_uint8(__ONLINE_buffer);
		__ONLINE_sName = buffer_read_string(__ONLINE_buffer);
		__ONLINE_sX = buffer_read_int32(__ONLINE_buffer);
		__ONLINE_sY = buffer_read_float64(__ONLINE_buffer);
		__ONLINE_sRoom = buffer_read_int16(__ONLINE_buffer);
		__ONLINE_a = instance_create(0, 0, __ONLINE_playerSaved);
		__ONLINE_a.__ONLINE_name = __ONLINE_sName;
		buffer_clear(__ONLINE_buffer);
		buffer_write_uint8(__ONLINE_buffer, __ONLINE_sGravity);
		buffer_write_int32(__ONLINE_buffer, __ONLINE_sX);
		buffer_write_float64(__ONLINE_buffer, __ONLINE_sY);
		buffer_write_int16(__ONLINE_buffer, __ONLINE_sRoom);
		buffer_write_to_file(__ONLINE_buffer, "tempOnline2");
		sound_play(__ONLINE_sndSaved);
		break;
		case 6:
		// SELF ID
		__ONLINE_selfID = buffer_read_string(__ONLINE_buffer);
		}
		}
		__ONLINE_mustQuit = false;
		switch(socket_get_state(__ONLINE_socket)){
		case 2:
		if(!__ONLINE_connected){
		__ONLINE_connected = true;
		}
		break;
		case 4:
		wd_message_simple("Connection closed.");
		__ONLINE_mustQuit = true;
		break;
		case 5:
		socket_reset(__ONLINE_socket);
		if(__ONLINE_connected){
		wd_message_simple("Connection lost.");
		}else{
		wd_message_simple("Could not connect to the server.");
		}
		__ONLINE_mustQuit = true;
		break;
		}
		if(__ONLINE_mustQuit){
		if(file_exists("temp")){
		file_delete("temp");
		}
		game_end();
		}
		__ONLINE_p = ${player.name};
		${
			player2 !== undefined ?
			`
			if(!instance_exists(__ONLINE_p)){
			__ONLINE_p = ${player2.name};
			}
			` : ""
		}
		__ONLINE_exists = instance_exists(__ONLINE_p);
		__ONLINE_X = __ONLINE_pX;
		__ONLINE_Y = __ONLINE_pY;
		if(__ONLINE_exists){
		if(__ONLINE_exists != __ONLINE_pExists){
		// SEND PLAYER CREATE
		buffer_clear(__ONLINE_buffer);
		buffer_write_uint8(__ONLINE_buffer, 0);
		socket_write_message(__ONLINE_socket, __ONLINE_buffer);
		}
		__ONLINE_X = __ONLINE_p.x;
		__ONLINE_Y = __ONLINE_p.y;
		if(__ONLINE_pX != __ONLINE_X || __ONLINE_pY != __ONLINE_Y || __ONLINE_t < 3){
		if(__ONLINE_t >= 3){
		__ONLINE_t = 0;
		}
		// SEND PLAYER MOVED
		if(__ONLINE_selfID != ""){
		buffer_clear(__ONLINE_buffer);
		buffer_write_uint8(__ONLINE_buffer, 1);
		buffer_write_string(__ONLINE_buffer, __ONLINE_selfID);
		buffer_write_string(__ONLINE_buffer, __ONLINE_selfGameID);
		buffer_write_int32(__ONLINE_buffer, __ONLINE_X);
		buffer_write_int32(__ONLINE_buffer, __ONLINE_Y);
		buffer_write_int32(__ONLINE_buffer, __ONLINE_p.sprite_index);
		buffer_write_float32(__ONLINE_buffer, __ONLINE_p.image_speed);
		buffer_write_float32(__ONLINE_buffer, __ONLINE_p.image_xscale);
		buffer_write_float32(__ONLINE_buffer, __ONLINE_p.image_yscale);
		buffer_write_float32(__ONLINE_buffer, __ONLINE_p.image_angle);
		buffer_write_uint16(__ONLINE_buffer, room);
		buffer_write_string(__ONLINE_buffer, __ONLINE_name);
		udpsocket_send(__ONLINE_udpsocket, __ONLINE_buffer);
		}
		}
		__ONLINE_t += 1;
		if(keyboard_check_pressed(vk_space)){
		__ONLINE_message = wd_input_box("Chat", "Say something:", "");
		__ONLINE_message = string_replace_all(__ONLINE_message, "#", "\\#");
		__ONLINE_message_length = string_length(__ONLINE_message);
		if(__ONLINE_message_length > 0){
		__ONLINE_message_max_length = 300;
		if(__ONLINE_message_length > __ONLINE_message_max_length){
		__ONLINE_message = string_copy(__ONLINE_message, 0, __ONLINE_message_max_length);
		}
		buffer_clear(__ONLINE_buffer);
		buffer_write_uint8(__ONLINE_buffer, 4);
		buffer_write_string(__ONLINE_buffer, __ONLINE_message);
		socket_write_message(__ONLINE_socket, __ONLINE_buffer);
		__ONLINE_oChatbox = instance_create(0, 0, __ONLINE_chatbox);
		__ONLINE_oChatbox.__ONLINE_message = __ONLINE_message;
		__ONLINE_oChatbox.__ONLINE_follower = __ONLINE_p;
		sound_play(__ONLINE_sndChatbox);
		}
		}
		}else{
		if(__ONLINE_exists != __ONLINE_pExists){
		// SEND PLAYER DESTROYED
		buffer_clear(__ONLINE_buffer);
		buffer_write_uint8(__ONLINE_buffer, 1);
		socket_write_message(__ONLINE_socket, __ONLINE_buffer);
		}
		}
		__ONLINE_pExists = __ONLINE_exists;
		__ONLINE_pX = __ONLINE_X;
		__ONLINE_pY = __ONLINE_Y;
		socket_update_write(__ONLINE_socket);
		/// UDP SOCKETS
		while(udpsocket_receive(__ONLINE_udpsocket, __ONLINE_buffer)){
		switch(buffer_read_uint8(__ONLINE_buffer)){
		case 1:
		// RECEIVE MOVED
		__ONLINE_ID = buffer_read_string(__ONLINE_buffer);
		__ONLINE_gameID = buffer_read_string(__ONLINE_buffer);
		if(__ONLINE_ID != __ONLINE_selfID || __ONLINE_gameID != __ONLINE_selfGameID){
		__ONLINE_found = false;
		__ONLINE_oPlayer = 0;
		for(__ONLINE_i = 0; __ONLINE_i < instance_number(__ONLINE_onlinePlayer); __ONLINE_i += 1){
		__ONLINE_oPlayer = instance_find(__ONLINE_onlinePlayer, __ONLINE_i);
		if(__ONLINE_oPlayer.__ONLINE_ID == __ONLINE_ID){
		__ONLINE_found = true;
		break;
		}
		}
		if(!__ONLINE_found){
		__ONLINE_oPlayer = instance_create(0, 0, __ONLINE_onlinePlayer);
		__ONLINE_oPlayer.__ONLINE_ID = __ONLINE_ID;
		}
		__ONLINE_oPlayer.x = buffer_read_int32(__ONLINE_buffer);
		__ONLINE_oPlayer.y = buffer_read_int32(__ONLINE_buffer);
		__ONLINE_oPlayer.sprite_index = buffer_read_int32(__ONLINE_buffer);
		__ONLINE_oPlayer.image_speed = buffer_read_float32(__ONLINE_buffer);
		__ONLINE_oPlayer.image_xscale = buffer_read_float32(__ONLINE_buffer);
		__ONLINE_oPlayer.image_yscale = buffer_read_float32(__ONLINE_buffer);
		__ONLINE_oPlayer.image_angle = buffer_read_float32(__ONLINE_buffer);
		__ONLINE_oPlayer.__ONLINE_oRoom = buffer_read_uint16(__ONLINE_buffer);
		__ONLINE_oPlayer.__ONLINE_name = buffer_read_string(__ONLINE_buffer);
		}
		break;
		default:
		wd_message_simple("Received unexpected data from the server.");
		}
		}
		if(udpsocket_get_state(__ONLINE_udpsocket) != 1){
		wd_message_simple("Connection to the UDP socket lost.");
		game_end();
		exit;
		}
		`;
	}
	public static getWorldGameEnd = function(): string {
		return `
		/// ONLINE
		if(!file_exists("temp")){
			if(file_exists("tempOnline")){
				file_delete("tempOnline");
			}
			if(file_exists("tempOnline2")){
				file_delete("tempOnline2");
			}
		}
		buffer_destroy(__ONLINE_buffer);
		if(!file_exists("tempOnline")){
			socket_destroy(__ONLINE_socket);
			udpsocket_destroy(__ONLINE_udpsocket);
		}
		`;
	}
	public static getOnlinePlayerCreate = function(): string {
		return `
		/// ONLINE
		__ONLINE_alpha = 1;
		__ONLINE_oRoom = -1;
		__ONLINE_name = "";
		`;
	}
	public static getOnlinePlayerEndStep = function(player: GMObject, player2: GMObject): string {
		return `
		/// ONLINE
		visible = __ONLINE_oRoom == room;
		image_alpha = __ONLINE_alpha;
		__ONLINE_p = ${player.name};
		${
			player2 !== undefined ?
			`
			if(!instance_exists(__ONLINE_p)){
				__ONLINE_p = ${player2.name};
			}
			` : ""
		}
		if(instance_exists(__ONLINE_p)){
			__ONLINE_dist = distance_to_object(${player.name});
			image_alpha = min(__ONLINE_alpha, __ONLINE_dist/100);
		}
		`;
	}
	public static getOnlinePlayerDraw = function(): string {
		return `
		/// ONLINE
		draw_sprite_ext(sprite_index, image_index, x, y, image_xscale, image_yscale, image_angle, c_white, image_alpha);
		__ONLINE__alpha = draw_get_alpha();
		__ONLINE__color = draw_get_color();
		draw_set_alpha(image_alpha);
		draw_set_font(__ONLINE_ftOnlinePlayerName);
		draw_set_valign(fa_center);
		draw_set_halign(fa_center);
		draw_set_color(c_black);
		__ONLINE_border = 2;
		__ONLINE_padding = 30;
		__ONLINE_xx = x;
		__ONLINE_yy = y-__ONLINE_padding;
		draw_set_alpha(1);
		draw_text(__ONLINE_xx+__ONLINE_border, __ONLINE_yy, __ONLINE_name);
		draw_text(__ONLINE_xx, __ONLINE_yy+__ONLINE_border, __ONLINE_name);
		draw_text(__ONLINE_xx-__ONLINE_border, __ONLINE_yy, __ONLINE_name);
		draw_text(__ONLINE_xx, __ONLINE_yy-__ONLINE_border, __ONLINE_name);
		draw_set_color(c_white);
		draw_text(__ONLINE_xx, __ONLINE_yy, __ONLINE_name);
		draw_set_alpha(__ONLINE__alpha);
		draw_set_color(__ONLINE__color);
		`;
	}
	public static getChatboxCreate = function(): string {
		return `
		/// ONLINE
		__ONLINE_paddingText = 10;
		__ONLINE_width = 250;
		__ONLINE_padding = 15;
		__ONLINE_alpha = 1;
		__ONLINE_fade = false;
		__ONLINE_fadeAlpha = 1;
		__ONLINE_t = 70;
		__ONLINE_sep = -1;
		__ONLINE_maxTextWidth = __ONLINE_width-2*__ONLINE_paddingText;
		`;
	}
	public static getChatboxEndStep = function(player: GMObject, player2: GMObject): string {
		return `
		/// ONLINE
		__ONLINE_f = __ONLINE_follower;
		if(__ONLINE_f == ${player.name} && !instance_exists(__ONLINE_f)){
			${
				player2 !== undefined ?
				`
				__ONLINE_f = ${player2.name};
				` : ""
			}
		}
		if(instance_exists(__ONLINE_f)){
			x = __ONLINE_f.x;
			y = __ONLINE_f.y;
		}else{
			instance_destroy();
		}
		if(__ONLINE_fade){
			__ONLINE_fadeAlpha -= .02;
			if(__ONLINE_fadeAlpha <= 0){
				instance_destroy();
			}
		}
		__ONLINE_alpha = 1;
		if(__ONLINE_follower != ${player.name}){
			visible = __ONLINE_follower.visible;
			__ONLINE_p = ${player.name};
			${
				player2 !== undefined ?
				`
				if(!instance_exists(__ONLINE_p)){
					__ONLINE_p = ${player2.name};
				}
				` : ""
			}
			if(instance_exists(__ONLINE_p)){
				__ONLINE_dist = distance_to_object(${player.name});
				__ONLINE_alpha = __ONLINE_dist/100;
			}
		}
		__ONLINE_t -= 1;
		if(__ONLINE_t < 0){
			__ONLINE_fade = true;
		}
		`;
	}
	public static getChatboxDraw = function(): string {
		return `
		/// ONLINE
		__ONLINE_textHeight = string_height_ext(__ONLINE_message, __ONLINE_sep, __ONLINE_maxTextWidth);
		__ONLINE_height = __ONLINE_textHeight+2*__ONLINE_paddingText;
		__ONLINE_yOffset = -__ONLINE_height/2+60;
		__ONLINE_left = 0;
		__ONLINE_right = room_width;
		__ONLINE_top = 0;
		__ONLINE_bottom = room_height;
		if(view_enabled && view_visible[0]){
			__ONLINE_left = view_xview[0];
			__ONLINE_right = __ONLINE_left+view_wview[0];
			__ONLINE_top = view_yview[0];
			__ONLINE_bottom = __ONLINE_top+view_hview[0];
		}
		__ONLINE_xx = min(max(x, __ONLINE_left+__ONLINE_width/2+__ONLINE_padding), __ONLINE_right-__ONLINE_width/2-__ONLINE_padding);
		__ONLINE_yy = min(max(y-__ONLINE_yOffset, __ONLINE_top+__ONLINE_height/2+__ONLINE_padding), __ONLINE_bottom-__ONLINE_height/2-__ONLINE_padding);
		__ONLINE__alpha = draw_get_alpha();
		__ONLINE__color = draw_get_color();
		draw_set_alpha(min(__ONLINE_alpha, __ONLINE_fadeAlpha));
		draw_set_color(c_white);
		draw_rectangle(__ONLINE_xx-__ONLINE_width/2, __ONLINE_yy-__ONLINE_height/2, __ONLINE_xx+__ONLINE_width/2, __ONLINE_yy+__ONLINE_height/2, false);
		draw_set_color(c_black);
		draw_rectangle(__ONLINE_xx-__ONLINE_width/2, __ONLINE_yy-__ONLINE_height/2, __ONLINE_xx+__ONLINE_width/2, __ONLINE_yy+__ONLINE_height/2, true);
		draw_set_font(__ONLINE_ftOnlinePlayerName);
		draw_set_valign(fa_center);
		draw_set_halign(fa_center);
		draw_text_ext(__ONLINE_xx, __ONLINE_yy, __ONLINE_message, __ONLINE_sep, __ONLINE_maxTextWidth);
		draw_set_alpha(__ONLINE__alpha);
		draw_set_color(__ONLINE__color);
		`;
	}
	public static getPlayerSavedEndStep = function(): string {
		return `
		/// ONLINE
		image_alpha -= .01;
		if(image_alpha <= 0){
			instance_destroy();
		}
		`;
	}
	public static getPlayerSavedDraw = function(): string {
		return `
		/// ONLINE
		__ONLINE_xx = 20;
		__ONLINE_yy = 20;
		if(view_enabled && view_visible[0]){
			__ONLINE_xx += view_xview[0];
			__ONLINE_yy += view_yview[0];
		}
		__ONLINE_text = __ONLINE_name+" saved!";
		__ONLINE__alpha = draw_get_alpha();
		__ONLINE__color = draw_get_color();
		draw_set_valign(fa_top);
		draw_set_halign(fa_left);
		draw_set_alpha(image_alpha);
		draw_set_font(__ONLINE_ftOnlinePlayerName);
		draw_set_color(c_black);
		draw_text(__ONLINE_xx+1, __ONLINE_yy, __ONLINE_text);
		draw_text(__ONLINE_xx, __ONLINE_yy+1, __ONLINE_text);
		draw_text(__ONLINE_xx-1, __ONLINE_yy, __ONLINE_text);
		draw_text(__ONLINE_xx, __ONLINE_yy-1, __ONLINE_text);
		draw_set_color(c_white);
		draw_text(__ONLINE_xx, __ONLINE_yy, __ONLINE_text);
		draw_set_alpha(__ONLINE__alpha);
		draw_set_color(__ONLINE__color);
		`;
	}
	public static getSaveGame = function(world: GMObject, player: GMObject, player2: GMObject): string {
		return `
		if(room != rSelectStage){
			buffer_clear(${world.name}.__ONLINE_buffer);
			__ONLINE_p = ${player.name};
			${
				player2 !== undefined ?
				`
				if(!instance_exists(__ONLINE_p)){
					__ONLINE_p = ${player2.name};
				}
				` : ""
			}
			if(instance_exists(__ONLINE_p)){
				buffer_write_uint8(${world.name}.__ONLINE_buffer, 5);
				if(__ONLINE_p == ${player.name}){
					buffer_write_uint8(${world.name}.__ONLINE_buffer, 0);
				}else{
					buffer_write_uint8(${world.name}.__ONLINE_buffer, 1);
				}
				buffer_write_int32(${world.name}.__ONLINE_buffer, __ONLINE_p.x);
				buffer_write_float64(${world.name}.__ONLINE_buffer, __ONLINE_p.y);
				buffer_write_int16(${world.name}.__ONLINE_buffer, room);
				socket_write_message(${world.name}.__ONLINE_socket, ${world.name}.__ONLINE_buffer);
			}
		}
		`;
	}
	public static getLoadGame = function(world: GMObject): string {
		return `
		with(${world.name}){
			buffer_clear(__ONLINE_buffer);
			buffer_write_uint16(__ONLINE_buffer, __ONLINE_socket);
			buffer_write_uint16(__ONLINE_buffer, __ONLINE_udpsocket);
			buffer_write_string(__ONLINE_buffer, __ONLINE_selfID);
			buffer_write_string(__ONLINE_buffer, __ONLINE_name);
			__ONLINE_n = instance_number(__ONLINE_onlinePlayer);
			buffer_write_uint16(__ONLINE_buffer, __ONLINE_n);
			for(__ONLINE_i = 0; __ONLINE_i < __ONLINE_n; __ONLINE_i += 1){
				__ONLINE_oPlayer = instance_find(__ONLINE_onlinePlayer, __ONLINE_i);
				buffer_write_string(__ONLINE_buffer, __ONLINE_oPlayer.__ONLINE_ID);
				buffer_write_int32(__ONLINE_buffer, __ONLINE_oPlayer.x);
				buffer_write_int32(__ONLINE_buffer, __ONLINE_oPlayer.y);
				buffer_write_int32(__ONLINE_buffer, __ONLINE_oPlayer.sprite_index);
				buffer_write_float32(__ONLINE_buffer, __ONLINE_oPlayer.image_speed);
				buffer_write_float32(__ONLINE_buffer, __ONLINE_oPlayer.image_xscale);
				buffer_write_float32(__ONLINE_buffer, __ONLINE_oPlayer.image_yscale);
				buffer_write_float32(__ONLINE_buffer, __ONLINE_oPlayer.image_angle);
				buffer_write_uint16(__ONLINE_buffer, __ONLINE_oPlayer.__ONLINE_oRoom);
				buffer_write_string(__ONLINE_buffer, __ONLINE_oPlayer.__ONLINE_name);
			}
			buffer_write_to_file(__ONLINE_buffer, "tempOnline");
		}
		`;
	}
	public static getTempSaveExe = function(world: GMObject, player: GMObject, player2: GMObject): string {
		return `
		if(file_exists("tempOnline2")){
			buffer_clear(${world.name}.__ONLINE_buffer);
			buffer_read_from_file(${world.name}.__ONLINE_buffer, "tempOnline2");
			__ONLINE_sGravity = buffer_read_uint8(${world.name}.__ONLINE_buffer);
			__ONLINE_sX = buffer_read_int32(${world.name}.__ONLINE_buffer);
			__ONLINE_sY = buffer_read_float64(${world.name}.__ONLINE_buffer);
			__ONLINE_sRoom = buffer_read_int16(${world.name}.__ONLINE_buffer);
			file_delete("tempOnline2");
			global.grav = __ONLINE_sGravity;
			__ONLINE_p = ${player.name};
			${
				player2 !== undefined ?
				`
				if(global.grav == 1){
					instance_create(0, 0, ${player2.name});
					with(${player.name}){
						instance_destroy();
					}
					__ONLINE_p = ${player2.name};
				}
				` : ""
			}
			__ONLINE_p.x = __ONLINE_sX;
			__ONLINE_p.y = __ONLINE_sY;
			room_goto(__ONLINE_sRoom);
		}
		`;
	}
}
