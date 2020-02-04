/// ONLINE
// %arg0: The name of the player object
// %arg1: The name of the player2 object if it exists
@f = @follower;
#if PLAYER2
	if(@f == %arg0 && !instance_exists(@f)){
		@f = %arg1;
	}
#endif
if(instance_exists(@f)){
	x = @f.x;
	y = @f.y;
}else{
	instance_destroy();
	exit;
}
if(@fade){
	@fadeAlpha -= 0.02;
	if(@fadeAlpha <= 0){
		instance_destroy();
		exit;
	}
}
@alpha = 1;
if(@follower != %arg0){
	visible = @follower.visible;
	@p = %arg0;
	#if PLAYER2
		@p = %arg1;
	#endif
	if(instance_exists(@p)){
		@dist = distance_to_object(@p);
		@alpha = @dist/100;
	}
}
@t -= 1;
if(@t < 0){
	@fade = true;
}
// Destroy all other chatboxes of the same player
if(!@hasDestroyed){
	@found = false;
	@oChatbox = 0;
	for(@i = 0; @i < instance_number(@chatbox) && !@found; @i += 1){
		@oChatbox = instance_find(@chatbox, @i);
		if(@oChatbox.@follower == @follower && @oChatbox.id != id){
			@found = true;
		}
	}
	if(@found){
		with(@oChatbox){
			instance_destroy();
		}
	}
	@hasDestroyed = true;
}
