/// ONLINE
// %arg0: The name of the world object
#if TEMPFILE
	with(%arg0){
		buffer_clear(@buffer);
		buffer_write_uint16(@buffer, @socket);
		buffer_write_uint16(@buffer, @udpsocket);
		buffer_write_string(@buffer, @selfID);
		buffer_write_string(@buffer, @name);
		buffer_write_string(@buffer, @selfGameID);
		@n = instance_number(@onlinePlayer);
		buffer_write_uint16(@buffer, @n);
		for(@i = 0; @i < @n; @i += 1){
			@oPlayer = instance_find(@onlinePlayer, @i);
			buffer_write_string(@buffer, @oPlayer.@ID);
			buffer_write_int32(@buffer, @oPlayer.x);
			buffer_write_int32(@buffer, @oPlayer.y);
			buffer_write_int32(@buffer, @oPlayer.sprite_index);
			buffer_write_float32(@buffer, @oPlayer.image_speed);
			buffer_write_float32(@buffer, @oPlayer.image_xscale);
			buffer_write_float32(@buffer, @oPlayer.image_yscale);
			buffer_write_float32(@buffer, @oPlayer.image_angle);
			buffer_write_uint16(@buffer, @oPlayer.@oRoom);
			buffer_write_string(@buffer, @oPlayer.@name);
		}
		buffer_write_to_file(@buffer, "tempOnline");
	}
#endif
