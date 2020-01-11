import path from "path"
import { GMObject } from "./asset/object"

export class GMLCode {
	public static getWorldCreate(ID: string, gamePath: string): string {
		return `
		/// ONLINE
		__ONLINE_connected = false;
		__ONLINE_buffer = buffer_create();
		if(file_exists("tempOnline")){
			buffer_read_from_file(__ONLINE_buffer, "tempOnline");
			__ONLINE_socket = buffer_read_uint16(__ONLINE_buffer);
			__ONLINE_n = buffer_read_uint16(__ONLINE_buffer);
			for(__ONLINE_i = 0; __ONLINE_i < n; __ONLINE_i += 1){
				__ONLINE_oPlayer = instance_create(0, 0, __ONLINE_onlinePlayer);
				__ONLINE_oPlayer.ID = buffer_read_string(__ONLINE_buffer);
				__ONLINE_oPlayer.x = buffer_read_int32(__ONLINE_buffer);
				__ONLINE_oPlayer.y = buffer_read_int32(__ONLINE_buffer);
				__ONLINE_oPlayer.sprite_index = buffer_read_int32(__ONLINE_buffer);
				__ONLINE_oPlayer.image_speed = buffer_read_float32(__ONLINE_buffer);
				__ONLINE_oPlayer.image_xscale = buffer_read_float32(__ONLINE_buffer);
				__ONLINE_oPlayer.image_yscale = buffer_read_float32(__ONLINE_buffer);
				__ONLINE_oPlayer.image_angle = buffer_read_float32(__ONLINE_buffer);
				__ONLINE_oPlayer.oRoom = buffer_read_uint16(__ONLINE_buffer);
				__ONLINE_oPlayer.name = buffer_read_string(__ONLINE_buffer);
			}
		}else{
			__ONLINE_socket = socket_create();
			socket_connect(__ONLINE_socket, "isocodes.org", 39083);
			__ONLINE_name = wd_input_box("Name", "Enter your name:", "");
			if(__ONLINE_name == ""){
				__ONLINE_name = "Anonymous";
			}
			__ONLINE_name = string_replace_all(__ONLINE_name, "#", "\#");
			if(string_length(__ONLINE_name) > 20){
				__ONLINE_name = string_copy(__ONLINE_name, 0, 20);
			}
			buffer_clear(__ONLINE_buffer);
			buffer_write_uint8(__ONLINE_buffer, 3);
			buffer_write_string(__ONLINE_buffer, __ONLINE_name);
			buffer_write_string(__ONLINE_buffer, "${ID}");
			buffer_write_string(__ONLINE_buffer, "${path.basename(gamePath, "exe")}");
			socket_write_message(__ONLINE_socket, __ONLINE_buffer);
		}
		__ONLINE_pExists = false;
		__ONLINE_pX = 0;
		__ONLINE_pY = 0;
		__ONLINE_updating = false;
		__ONLINE_t = 0;
		__ONLINE_timeUpdating = 3;
		`;
	}
	public static getWorldEndStep = function(player: GMObject, player2: GMObject): string {
		return `
		/// ONLINE
		if(__ONLINE_t > __ONLINE_timeUpdating){
			__ONLINE_updating = false;
		}
		socket_update_read(__ONLINE_socket);
		while(socket_read_message(__ONLINE_socket, __ONLINE_buffer)){
			switch(buffer_read_uint8(__ONLINE_buffer)){
				case 0:
					// CREATED
					__ONLINE_ID = buffer_read_string(__ONLINE_buffer);
					__ONLINE_found = false;
					for(__ONLINE_i = 0; __ONLINE_i < instance_number(__ONLINE_onlinePlayer); __ONLINE_i += 1){
						if(instance_find(__ONLINE_onlinePlayer, __ONLINE_i).ID == __ONLINE_ID){
							__ONLINE_found = true;
							break;
						}
					}
					if(!__ONLINE_found){
						__ONLINE_oPlayer = instance_create(0, 0, __ONLINE_onlinePlayer);
						__ONLINE_oPlayer.ID = __ONLINE_ID;
					}
					break;
				case 1:
					// DESTROYED
					__ONLINE_ID = buffer_read_string(__ONLINE_buffer);
					for(__ONLINE_i = 0; __ONLINE_i < instance_number(__ONLINE_onlinePlayer); __ONLINE_i += 1){
						__ONLINE_oPlayer = instance_find(__ONLINE_onlinePlayer, __ONLINE_i);
						if(__ONLINE_oPlayer.ID == __ONLINE_ID){
							with(__ONLINE_oPlayer){
								instance_destroy();
							}
							break;
						}
					}
					break;
				case 2:
					// MOVED
					__ONLINE_ID = buffer_read_string(__ONLINE_buffer);
					__ONLINE_found = false;
					__ONLINE_oPlayer = 0;
					for(__ONLINE_i = 0; __ONLINE_i < instance_number(__ONLINE_onlinePlayer); __ONLINE_i += 1){
						__ONLINE_oPlayer = instance_find(__ONLINE_onlinePlayer, __ONLINE_i);
						if(__ONLINE_oPlayer.ID == __ONLINE_ID){
							__ONLINE_found = true;
							break;
						}
					}
					if(!__ONLINE_found){
						__ONLINE_oPlayer = instance_create(0, 0, __ONLINE_onlinePlayer);
					}
					__ONLINE_oPlayer.ID = __ONLINE_ID;
					__ONLINE_oPlayer.x = buffer_read_int32(__ONLINE_buffer);
					__ONLINE_oPlayer.y = buffer_read_int32(__ONLINE_buffer);
					__ONLINE_oPlayer.sprite_index = buffer_read_int32(__ONLINE_buffer);
					__ONLINE_oPlayer.image_speed = buffer_read_float32(__ONLINE_buffer);
					__ONLINE_oPlayer.image_xscale = buffer_read_float32(__ONLINE_buffer);
					__ONLINE_oPlayer.image_yscale = buffer_read_float32(__ONLINE_buffer);
					__ONLINE_oPlayer.image_angle = buffer_read_float32(__ONLINE_buffer);
					__ONLINE_oPlayer.oRoom = buffer_read_uint16(__ONLINE_buffer);
					__ONLINE_oPlayer.name = buffer_read_string(__ONLINE_buffer);
					break;
				case 4:
					// CHAT MESSAGE
					__ONLINE_ID = buffer_read_string(__ONLINE_buffer);
					__ONLINE_found = false;
					__ONLINE_oPlayer = 0;
					for(__ONLINE_i = 0; __ONLINE_i < instance_number(__ONLINE_onlinePlayer); __ONLINE_i += 1){
						__ONLINE_oPlayer = instance_find(__ONLINE_onlinePlayer, i);
						if(__ONLINE_oPlayer.ID == __ONLINE_ID){
							__ONLINE_found = true;
							break;
						}
					}
					if(__ONLINE_found){
						__ONLINE_message = buffer_read_string(__ONLINE_buffer);
						__ONLINE_oChatbox = instance_create(0, 0, __ONLINE_chatbox);
						__ONLINE_oChatbox.message = __ONLINE_message;
						__ONLINE_oChatbox.follower = __ONLINE_oPlayer;
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
					__ONLINE_a.name = __ONLINE_sName;
					buffer_clear(__ONLINE_buffer);
					buffer_write_uint8(__ONLINE_buffer, __ONLINE_sGravity);
					buffer_write_int32(__ONLINE_buffer, __ONLINE_sX);
					buffer_write_float64(__ONLINE_buffer, __ONLINE_sY);
					buffer_write_int16(__ONLINE_buffer, __ONLINE_sRoom);
					buffer_write_to_file(__ONLINE_buffer, "tempOnline2");
					sound_play(__ONLINE_sndSaved);
					break;
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
				if(connected){
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
			if(!__ONLINE_updating){
				__ONLINE_X = __ONLINE_p.x;
				__ONLINE_Y = __ONLINE_p.y;
				if(__ONLINE_pX != __ONLINE_X || __ONLINE_pY != __ONLINE_Y){
					// SEND PLAYER MOVED
					buffer_clear(__ONLINE_buffer);
					buffer_write_uint8(__ONLINE_buffer, 2);
					buffer_write_int32(__ONLINE_buffer, __ONLINE_X);
					buffer_write_int32(__ONLINE_buffer, __ONLINE_Y);
					buffer_write_int32(__ONLINE_buffer, __ONLINE_p.sprite_index);
					buffer_write_float32(__ONLINE_buffer, __ONLINE_p.image_speed);
					buffer_write_float32(__ONLINE_buffer, __ONLINE_p.image_xscale);
					buffer_write_float32(__ONLINE_buffer, __ONLINE_p.image_yscale);
					buffer_write_float32(__ONLINE_buffer, __ONLINE_p.image_angle);
					buffer_write_uint16(__ONLINE_buffer, room);
					socket_write_message(__ONLINE_socket, __ONLINE_buffer);
					__ONLINE_updating = true;
					__ONLINE_t = 0;
				}
			}
			if(keyboard_check_pressed(vk_space)){
				__ONLINE_message = wd_input_box("Chat", "Say something:", "");
				__ONLINE_message = string_replace_all(__ONLINE_message, "#", "\#");
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
					__ONLINE_oChatbox.message = __ONLINE_message;
					__ONLINE_oChatbox.follower = __ONLINE_p;
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
		__ONLINE_pX = X;
		__ONLINE_pY = Y;
		__ONLINE_t += 1;
		socket_update_write(__ONLINE_socket);	
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
		}
		`;
	}
	public static getOnlinePlayerCreate = function(): string {
		return `
		/// ONLINE
		alpha = 1;
		`;
	}
	public static getOnlinePlayerEndStep = function(player: GMObject, player2: GMObject): string {
		return `
		/// ONLINE
		visible = oRoom == room;
		image_alpha = alpha;
		p = ${player.name};
		${
			player2 !== undefined ?
			`
			if(!instance_exists(p)){
				p = ${player2.name};
			}
			` : ""
		}
		if(instance_exists(p)){
			dist = distance_to_object(${player.name});
			image_alpha = min(alpha, dist/100);
		}
		`;
	}
	public static getOnlinePlayerDraw = function(): string {
		return `
		/// ONLINE
		draw_sprite_ext(sprite_index, image_index, x, y, image_xscale, image_yscale, image_angle, c_white, image_alpha);
		_alpha = draw_get_alpha();
		_color = draw_get_color();
		draw_set_alpha(image_alpha);
		draw_set_font(__ONLINE_ftOnlinePlayerName);
		draw_set_valign(fa_center);
		draw_set_halign(fa_center);
		draw_set_color(c_black);
		border = 2;
		padding = 30;
		xx = x;
		yy = y-padding;
		draw_set_alpha(1);
		draw_text(xx+border, yy, name);
		draw_text(xx, yy+border, name);
		draw_text(xx-border, yy, name);
		draw_text(xx, yy-border, name);
		draw_set_color(c_white);
		draw_text(xx, yy, name);
		draw_set_alpha(_alpha);
		draw_set_color(_color);
		`;
	}
	public static getChatboxCreate = function(): string {
		return `
		/// ONLINE
		paddingText = 10;
		width = 250;
		padding = 15;
		alpha = 1;
		fade = false;
		fadeAlpha = 1;
		t = 70;
		sep = -1;
		maxTextWidth = width-2*paddingText;
		`;
	}
	public static getChatboxEndStep = function(player: GMObject, player2: GMObject): string {
		return `
		/// ONLINE
		f = follower;
		if(f == ${player.name} && !instance_exists(f)){
			${
				player2 !== undefined ?
				`
				f = ${player2.name};
				` : ""
			}
		}
		if(instance_exists(f)){
			x = f.x;
			y = f.y;
		}else{
			instance_destroy();
		}
		if(fade){
			fadeAlpha -= .02;
			if(fadeAlpha <= 0){
				instance_destroy();
			}
		}
		alpha = 1;
		if(follower != player){
			visible = follower.visible;
			p = ${player.name};
			${
				player2 !== undefined ?
				`
				if(!instance_exists(p)){
					p = ${player2.name};
				}
				` : ""
			}
			if(instance_exists(p)){
				dist = distance_to_object(${player.name});
				alpha = dist/100;
			}
		}
		t -= 1;
		if(t < 0){
			fade = true;
		}
		`;
	}
	public static getChatboxDraw = function(): string {
		return `
		/// ONLINE
		textHeight = string_height_ext(message, sep, maxTextWidth);
		height = textHeight+2*paddingText;
		yOffset = -height/2+60;
		left = 0;
		right = room_width;
		top = 0;
		bottom = room_height;
		if(view_enabled && view_visible[0]){
			left = view_xview[0];
			right = left+view_wview[0];
			top = view_yview[0];
			bottom = top+view_hview[0];
		}
		xx = min(max(x, left+width/2+padding), right-width/2-padding);
		yy = min(max(y-yOffset, top+height/2+padding), bottom-height/2-padding);
		_alpha = draw_get_alpha();
		_color = draw_get_color();
		draw_set_alpha(min(alpha, fadeAlpha));
		draw_set_color(c_white);
		draw_rectangle(xx-width/2, yy-height/2, xx+width/2, yy+height/2, false);
		draw_set_color(c_black);
		draw_rectangle(xx-width/2, yy-height/2, xx+width/2, yy+height/2, true);
		draw_set_font(__ONLINE_ftOnlinePlayerName);
		draw_set_valign(fa_center);
		draw_set_halign(fa_center);
		draw_text_ext(xx, yy, message, sep, maxTextWidth);
		draw_set_alpha(_alpha);
		draw_set_color(_color);
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
		xx = 20;
		yy = 20;
		if(view_enabled && view_visible[0]){
			xx += view_xview[0];
			yy += view_yview[0];
		}
		text = name+" saved!";
		_alpha = draw_get_alpha();
		_color = draw_get_color();
		draw_set_valign(fa_top);
		draw_set_halign(fa_left);
		draw_set_alpha(image_alpha);
		draw_set_font(__ONLINE_ftOnlinePlayerName);
		draw_set_color(c_black);
		draw_text(xx+1, yy, text);
		draw_text(xx, yy+1, text);
		draw_text(xx-1, yy, text);
		draw_text(xx, yy-1, text);
		draw_set_color(c_white);
		draw_text(xx, yy, text);
		draw_set_alpha(_alpha);
		draw_set_color(_color);
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
			__ONLINE_n = instance_number(__ONLINE_onlinePlayer);
			buffer_write_uint16(__ONLINE_buffer, __ONLINE_n);
			for(__ONLINE_i = 0; __ONLINE_i < __ONLINE_n; __ONLINE_i += 1){
				__ONLINE_oPlayer = instance_find(__ONLINE_onlinePlayer, __ONLINE_i);
				buffer_write_string(__ONLINE_buffer, __ONLINE_oPlayer.ID);
				buffer_write_int32(__ONLINE_buffer, __ONLINE_oPlayer.x);
				buffer_write_int32(__ONLINE_buffer, __ONLINE_oPlayer.y);
				buffer_write_int32(__ONLINE_buffer, __ONLINE_oPlayer.sprite_index);
				buffer_write_float32(__ONLINE_buffer, __ONLINE_oPlayer.image_speed);
				buffer_write_float32(__ONLINE_buffer, __ONLINE_oPlayer.image_xscale);
				buffer_write_float32(__ONLINE_buffer, __ONLINE_oPlayer.image_yscale);
				buffer_write_float32(__ONLINE_buffer, __ONLINE_oPlayer.image_angle);
				buffer_write_uint16(__ONLINE_buffer, __ONLINE_oPlayer.oRoom);
				buffer_write_string(__ONLINE_buffer, __ONLINE_oPlayer.name);
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
