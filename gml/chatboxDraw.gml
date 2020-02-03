/// ONLINE
#if not STUDIO
	draw_set_font(@ftOnlinePlayerName);
#endif
@textHeight = string_height_ext(@message, @sep, @maxTextWidth);
@height = @textHeight+2*@paddingText;
@yOffset = -@height/2+60;
@left = 0;
@right = room_width;
@top = 0;
@bottom = room_height;
if(view_enabled && view_visible[0]){
	@left = view_xview[0];
	@right = @left+view_wview[0];
	@top = view_yview[0];
	@bottom = @top+view_hview[0];
}
@xx = min(max(x, @left+@width/2+@padding), @right-@width/2-@padding);
@yy = min(max(y-@yOffset, @top+@height/2+@padding), @bottom-@height/2-@padding);
@_alpha = draw_get_alpha();
@_color = draw_get_color();
draw_set_alpha(min(@alpha, @fadeAlpha));
draw_set_color(c_white);
draw_rectangle(@xx-@width/2, @yy-@height/2, @xx+@width/2, @yy+@height/2, false);
draw_set_color(c_black);
draw_rectangle(@xx-@width/2, @yy-@height/2, @xx+@width/2, @yy+@height/2, true);
draw_set_valign(fa_center);
draw_set_halign(fa_center);
draw_text_ext(@xx, @yy, @message, @sep, @maxTextWidth);
draw_set_alpha(@_alpha);
draw_set_color(@_color);
#if not STUDIO
	draw_set_font(0);
#endif
draw_set_valign(fa_top);
draw_set_halign(fa_left);
