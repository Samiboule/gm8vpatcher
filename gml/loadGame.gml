/// ONLINE
// %arg0: The name of the world object
// %arg1: The name of the player object
// %arg2: The name of the player2 object if it exists
#if TEMPFILE
	if(file_exists("tempOnline2")){
		buffer_clear(%arg0.@buffer);
		buffer_read_from_file(%arg0.@buffer, "tempOnline2");
		%arg0.@sGravity = buffer_read_uint8(%arg0.@buffer);
		%arg0.@sX = buffer_read_int32(%arg0.@buffer);
		%arg0.@sY = buffer_read_float64(%arg0.@buffer);
		%arg0.@sRoom = buffer_read_int16(%arg0.@buffer);
		file_delete("tempOnline2");
#endif
#if not TEMPFILE
	if(%arg0.@sSaved){
#endif
	if(room_exists(%arg0.@sRoom)){
		@p = %arg1;
		#if PLAYER2
			if(%arg0.@sGravity == 1){
				instance_create(0, 0, %arg2);
				with(%arg1){
					instance_destroy();
				}
				@p = %arg2;
			}
		#endif
		#if STUDIO
			if(global.grav != %arg0.@sGravity){
				#if SCR_FLIP_GRAV
					scrFlipGrav();
				#endif
				#if not SCR_FLIP_GRAV
					with(@p){
						event_user(0);
					}
				#endif
			}
		#endif
		#if not STUDIO
			global.grav = @sGravity;
		#endif
		@p = %arg1;
		@p.x = %arg0.@sX;
		@p.y = %arg0.@sY;
		room_goto(%arg0.@sRoom);
	}
	%arg0.@sSaved = false;
}
