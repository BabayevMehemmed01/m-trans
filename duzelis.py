from moviepy import VideoFileClip

# Videonu yükləyin
clip = VideoFileClip("konum_video.mov")

# logger=None -> Qırmızı yazıların ekrana çıxmasını və IDLE-ı dondurmasını tamamilə bloklayır.
# threads=4 -> Kompüterinizin prosessorunun 4 nüvəsini eyni anda işlədir (sürəti qat-qat artırır).
clip.write_videofile(
    "veb_video.mp4", 
    bitrate="2000k", 
    audio_codec="aac", 
    threads=4, 
    logger=None
)

print("Proses uğurla tamamlandı! Veb videonuz hazırdır.")
