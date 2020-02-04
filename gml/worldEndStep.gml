/// ONLINE
// TCP SOCKETS
socket_update_read(@socket);
while(socket_read_message(@socket, @buffer)){
	switch(buffer_read_uint8(@buffer)){
		case 0:
			// CREATED
			@ID = buffer_read_string(@buffer);
			@found = false;
			for(@i = 0; @i < instance_number(@onlinePlayer) && !@found; @i += 1){
				if(instance_find(@onlinePlayer, @i).@ID == @ID){
					@found = true;
				}
			}
			if(!@found){
				@oPlayer = instance_create(0, 0, @onlinePlayer);
				@oPlayer.@ID = @ID;
				@oPlayer.@name = buffer_read_string(@buffer);
			}
			break;
		case 1:
			// DESTROYED
			@ID = buffer_read_string(@buffer);
			@found = false;
			for(@i = 0; @i < instance_number(@onlinePlayer) && !@found; @i += 1){
				@oPlayer = instance_find(@onlinePlayer, @i);
				if(@oPlayer.@ID == @ID){
					with(@oPlayer){
						instance_destroy();
					}
					@found = true;
				}
			}
			break;
		case 2:
			// INCOMPATIBLE VERSION
			@lastVersion = buffer_read_string(@buffer);
			@errorMessage = "Your tool uses the version "+@version+" but the oldest compatible version is "+@lastVersion+". Please update your tool.";
			#if STUDIO
				show_message(@errorMessage);
			#endif
			#if not STUDIO
				wd_message_simple(@errorMessage);
			#endif
			game_end();
			exit;
			break;
		case 4:
			// CHAT MESSAGE
			@ID = buffer_read_string(@buffer);
			@found = false;
			@oPlayer = 0;
			for(@i = 0; @i < instance_number(@onlinePlayer) && !@found; @i += 1){
				@oPlayer = instance_find(@onlinePlayer, @i);
				if(@oPlayer.@ID == @ID){
					@found = true;
				}
			}
			if(@found){
				@message = buffer_read_string(@buffer);
				@oChatbox = instance_create(0, 0, @chatbox);
				@oChatbox.@message = @message;
				@oChatbox.@follower = @oPlayer;
				if(@oPlayer.visible){
					#if STUDIO
						audio_play_sound(@sndChatbox, 0, false);
					#endif
					#if not STUDIO
						sound_play(@sndChatbox);
					#endif
				}
			}
			break;
		case 5:
			// SOMEONE SAVED
			@sSaved = true;
			@sGravity = buffer_read_uint8(@buffer);
			@sName = buffer_read_string(@buffer);
			@sX = buffer_read_int32(@buffer);
			@sY = buffer_read_float64(@buffer);
			@sRoom = buffer_read_int16(@buffer);
			@a = instance_create(0, 0, @playerSaved);
			@a.@name = @sName;
			#if TEMPFILE
				buffer_clear(@buffer);
				buffer_write_uint8(@buffer, @sGravity);
				buffer_write_int32(@buffer, @sX);
				buffer_write_float64(@buffer, @sY);
				buffer_write_int16(@buffer, @sRoom);
				buffer_write_to_file(@buffer, "tempOnline2");
			#endif
			#if STUDIO
				audio_play_sound(@sndSaved, 0, false);
			#endif
			#if not STUDIO
				sound_play(@sndSaved);
			#endif
			break;
		case 6:
			// SELF ID
			@selfID = buffer_read_string(@buffer);
			break;
	}
}
@mustQuit = false;
switch(socket_get_state(@socket)){
	case 2:
		if(!@connected){
			@connected = true;
		}
		break;
	case 4:
		#if STUDIO
			show_message("Connection closed.");
		#endif
		#if not STUDIO
			wd_message_simple("Connection closed.");
		#endif
		@mustQuit = true;
		break;
	case 5:
		socket_reset(@socket);
		@errorMessage = "Could not connect to the server.";
		if(@connected){
			@errorMessage = "Connection lost";
		}
		#if STUDIO
			show_message(@errorMessage);
		#endif
		#if not STUDIO
			wd_message_simple(@errorMessage);
		#endif
		@mustQuit = true;
		break;
}
if(@mustQuit){
	#if TEMPFILE
		if(file_exists("temp")){
			file_delete("temp");
		}
	#endif
	game_end();
	exit;
}
@p = %arg0;
#if PLAYER2
	if(!instance_exists(@p)){
		@p = %arg1;
	}
#endif
@exists = instance_exists(@p);
@X = @pX;
@Y = @pY;
if(@exists){
	if(@exists != @pExists){
		// SEND PLAYER CREATE
		buffer_clear(@buffer);
		buffer_write_uint8(@buffer, 0);
		socket_write_message(@socket, @buffer);
	}
	@X = @p.x;
	@Y = @p.y;
	@stoppedFrames += 1;
	if(@pX != @X || @pY != @Y || keyboard_check_released(vk_anykey) || keyboard_check_pressed(vk_anykey)){
		@stoppedFrames = 0;
	}
	if(@stoppedFrames < 5 || @t < 3){
		if(@t >= 3){
			@t = 0;
		}
		// SEND PLAYER MOVED
		if(@selfID != ""){
			buffer_clear(@buffer);
			buffer_write_uint8(@buffer, 1);
			buffer_write_string(@buffer, @selfID);
			buffer_write_string(@buffer, @selfGameID);
			buffer_write_uint16(@buffer, room);
			buffer_write_uint64(@buffer, current_time);
			buffer_write_int32(@buffer, @X);
			buffer_write_int32(@buffer, @Y);
			buffer_write_int32(@buffer, @p.sprite_index);
			buffer_write_float32(@buffer, @p.image_speed);
			#if GLOBAL_PLAYER_XSCALE
				buffer_write_float32(@buffer, @p.image_xscale*global.player_xscale);
			#endif
			#if not GLOBAL_PLAYER_XSCALE
				#if STUDIO
					buffer_write_float32(@buffer, @p.image_xscale*@p.xScale);
				#endif
				#if not STUDIO
					buffer_write_float32(@buffer, @p.image_xscale);
				#endif
			#endif
			#if STUDIO
				buffer_write_float32(@buffer, @p.image_yscale*global.grav);
			#endif
			#if not STUDIO
				buffer_write_float32(@buffer, @p.image_yscale);
			#endif
			buffer_write_float32(@buffer, @p.image_angle);
			buffer_write_string(@buffer, @name);
			udpsocket_send(@udpsocket, @buffer);
		}
	}
	@t += 1;
	if(keyboard_check_pressed(vk_space)){
		#if STUDIO
			@message = get_string("Say something:", "");
		#endif
		#if not STUDIO
			@message = wd_input_box("Chat", "Say something:", "");
		#endif
		@message = string_replace_all(@message, "#", "\\#");
		@message_length = string_length(@message);
		if(@message_length > 0){
			@message_max_length = 300;
			if(@message_length > @message_max_length){
				@message = string_copy(@message, 0, @message_max_length);
			}
			buffer_clear(@buffer);
			buffer_write_uint8(@buffer, 4);
			buffer_write_string(@buffer, @message);
			socket_write_message(@socket, @buffer);
			@oChatbox = instance_create(0, 0, @chatbox);
			@oChatbox.@message = @message;
			@oChatbox.@follower = @p;
			#if STUDIO
				audio_play_sound(@sndChatbox, 0, false);
			#endif
			#if not STUDIO
				sound_play(@sndChatbox);
			#endif
		}
	}
}else{
	if(@exists != @pExists){
		// SEND PLAYER DESTROYED
		buffer_clear(@buffer);
		buffer_write_uint8(@buffer, 1);
		socket_write_message(@socket, @buffer);
	}
}
@pExists = @exists;
@pX = @X;
@pY = @Y;
@heartbeat += 1/room_speed;
if(@heartbeat > 3){
	@heartbeat = 0;
	// SEND PLAYER HEARTBEAT
	buffer_clear(@buffer);
	buffer_write_uint8(@buffer, 2);
	socket_write_message(@socket, @buffer);
}
socket_update_write(@socket);
// UDP SOCKETS
while(udpsocket_receive(@udpsocket, @buffer)){
	switch(buffer_read_uint8(@buffer)){
		case 1:
			// RECEIVED MOVED
			@ID = buffer_read_string(@buffer);
			@gameID = buffer_read_string(@buffer);
			@found = false;
			@oPlayer = 0;
			for(@i = 0; @i < instance_number(@onlinePlayer) && !@found; @i += 1){
				@oPlayer = instance_find(@onlinePlayer, @i);
				if(@oPlayer.@ID == @ID){
					@found = true;
				}
			}
			if(!@found){
				@oPlayer = instance_create(0, 0, @onlinePlayer);
				@oPlayer.@ID = @ID;
			}
			@oPlayer.@oRoom = buffer_read_uint16(@buffer);
			@syncTime = buffer_read_uint64(@buffer);
			if(@oPlayer.@syncTime < @syncTime){
				@oPlayer.@syncTime = @syncTime;
				@oPlayer.x = buffer_read_int32(@buffer);
				@oPlayer.y = buffer_read_int32(@buffer);
				@oPlayer.sprite_index = buffer_read_int32(@buffer);
				@oPlayer.image_speed = buffer_read_float32(@buffer);
				@oPlayer.image_xscale = buffer_read_float32(@buffer);
				@oPlayer.image_yscale = buffer_read_float32(@buffer);
				@oPlayer.image_angle = buffer_read_float32(@buffer);
				@oPlayer.@name = buffer_read_string(@buffer);
			}
			break;
		default:
			#if STUDIO
				show_message("Received unexpected data from the server.");
			#endif
			#if not STUDIO
				wd_message_simple("Received unexpected data from the server.");
			#endif
	}
}
if(udpsocket_get_state(@udpsocket) != 1){
	#if STUDIO
		show_message("Connection to the UDP socket lost.");
	#endif
	#if not STUDIO
		wd_message_simple("Connection to the UDP socket lost.");
	#endif
	game_end();
	exit;
}
