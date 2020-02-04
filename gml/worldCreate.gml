/// ONLINE
// %arg0: The ID of the game
// %arg1: The server
// %arg2: The TCP port
// %arg3: The UDP port
// %arg4: The game name
// %arg5: The version
@connected = false;
@buffer = buffer_create();
@selfID = "";
@name = "";
@selfGameID = "%arg0";
@server = "%arg1";
@version = "%arg5";
#if TEMPFILE
	if(file_exists("tempOnline")){
		buffer_read_from_file(@buffer, "tempOnline");
		@socket = buffer_read_uint16(@buffer);
		@udpsocket = buffer_read_uint16(@buffer);
		@selfID = buffer_read_string(@buffer);
		@name = buffer_read_string(@buffer);
		@selfGameID = buffer_read_string(@buffer);
		@n = buffer_read_uint16(@buffer);
		for(@i = 0; @i < @n; @i += 1){
			@oPlayer = instance_create(0, 0, @onlinePlayer);
			@oPlayer.@ID = buffer_read_string(@buffer);
			@oPlayer.x = buffer_read_int32(@buffer);
			@oPlayer.y = buffer_read_int32(@buffer);
			@oPlayer.sprite_index = buffer_read_int32(@buffer);
			@oPlayer.image_speed = buffer_read_float32(@buffer);
			@oPlayer.image_xscale = buffer_read_float32(@buffer);
			@oPlayer.image_yscale = buffer_read_float32(@buffer);
			@oPlayer.image_angle = buffer_read_float32(@buffer);
			@oPlayer.@oRoom = buffer_read_uint16(@buffer);
			@oPlayer.@name = buffer_read_string(@buffer);
		}
	}else{
#endif
	@socket = socket_create();
	socket_connect(@socket, @server, %arg2);
	#if STUDIO
		@name = get_string("Enter your name:", "");
	#endif
	#if not STUDIO
		@name = wd_input_box("Name", "Enter your name:", "");
	#endif
	if(@name == ""){
		@name = "Anonymous";
	}
	@name = string_replace_all(@name, "#", "\#");
	if(string_length(@name) > 20){
		@name = string_copy(@name, 0, 20);
	}
	#if STUDIO
		@password = get_string("Enter a password:", "");
	#endif
	#if not STUDIO
		@password = wd_input_box("Password", "Leave it empty for no password:", "");
	#endif
	if(string_length(@password) > 20){
		@password = string_copy(@password, 0, 20);
	}
	@selfGameID += @password;
	buffer_clear(@buffer);
	buffer_write_uint8(@buffer, 3);
	buffer_write_string(@buffer, @name);
	buffer_write_string(@buffer, @selfGameID);
	buffer_write_string(@buffer, "%arg4");
	buffer_write_string(@buffer, @version);
	socket_write_message(@socket, @buffer);
	@udpsocket = udpsocket_create();
	udpsocket_start(@udpsocket, false, 0);
	udpsocket_set_destination(@udpsocket, @server, %arg3);
	buffer_clear(@buffer);
	buffer_write_uint8(@buffer, 0);
	udpsocket_send(@udpsocket, @buffer);
#if TEMPFILE
	}
#endif
@pExists = false;
@pX = 0;
@pY = 0;
@t = 0;
@heartbeat = 0;
@stoppedFrames = 0;
@sGravity = 0;
@sX = 0;
@sY = 0;
@sRoom = 0;
@sSaved = false;
