/// ONLINE
if(file_exists("tempOnline2")){
	buffer_clear(%arg0.@buffer);
	buffer_read_from_file(%arg0.@buffer, "tempOnline2");
	@sGravity = buffer_read_uint8(%arg0.@buffer);
	@sX = buffer_read_int32(%arg0.@buffer);
	@sY = buffer_read_float64(%arg0.@buffer);
	@sRoom = buffer_read_int16(%arg0.@buffer);
	file_delete("tempOnline2");
	if(room_exists(@sRoom)){
		global.grav = @sGravity;
		@p = %arg1;
		#if PLAYER2
			if(global.grav == 1){
				instance_create(0, 0, %arg1);
				with(%arg0){
					instance_destroy();
				}
				@p = %arg1;
			}
		#endif
		@p.x = @sX;
		@p.y = @sY;
		room_goto(@sRoom);  
	}
}
