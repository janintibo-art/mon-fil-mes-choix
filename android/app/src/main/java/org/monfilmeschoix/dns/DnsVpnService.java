package org.monfilmeschoix.dns;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.net.VpnService;
import android.os.Build;
import android.os.ParcelFileDescriptor;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** VPN with one /32 route to its own synthetic DNS server. Does not route web traffic. */
public final class DnsVpnService extends VpnService {
    static final String START="org.monfilmeschoix.START", STOP="org.monfilmeschoix.STOP", RELOAD="org.monfilmeschoix.RELOAD";
    static volatile boolean ACTIVE = false;
    private volatile boolean running;
    private ParcelFileDescriptor tun;
    private Thread tunnelThread;
    private ExecutorService workers;
    private FileOutputStream output;
    private volatile Set<String> denied;
    private final Object writeLock = new Object();
    private static final byte[] LOCAL_IP = new byte[]{10,111,0,1};
    private static final byte[] DNS_IP = new byte[]{10,111,0,2};

    @Override public int onStartCommand(Intent command, int flags, int id) {
        if(command != null && STOP.equals(command.getAction())) { stopSelf(); return START_NOT_STICKY; }
        if(command != null && RELOAD.equals(command.getAction())) {
            if(running) denied = ExtraBlocks.all(this, DomainRules.get(this));
            return running ? START_STICKY : START_NOT_STICKY;
        }
        if(running) return START_STICKY;
        try {
            NotificationManager nm = (NotificationManager)getSystemService(NOTIFICATION_SERVICE);
            nm.createNotificationChannel(new NotificationChannel("dns_filter","Filtre DNS actif",NotificationManager.IMPORTANCE_LOW));
            Intent open = new Intent(this, MainActivity.class);
            PendingIntent pi = PendingIntent.getActivity(this,0,open,PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_UPDATE_CURRENT);
            Notification notice = new Notification.Builder(this,"dns_filter")
                .setSmallIcon(android.R.drawable.ic_lock_lock)
                .setContentTitle("Mon fil, mes choix")
                .setContentText("Filtrage DNS actif • ouvrir pour désactiver")
                .setContentIntent(pi).setOngoing(true).build();
            startForeground(15,notice);
            denied = ExtraBlocks.all(this, DomainRules.get(this));
            Builder builder = new Builder().setSession("Mon fil, mes choix DNS")
                .setMtu(1500).addAddress("10.111.0.1",30)
                .addDnsServer("10.111.0.2").addRoute("10.111.0.2",32);
            tun = builder.establish();
            if(tun == null) {stopSelf();return START_NOT_STICKY;}
            output = new FileOutputStream(tun.getFileDescriptor());
            workers = Executors.newFixedThreadPool(4);
            running = true;
            ACTIVE = true;
            tunnelThread = new Thread(this::runTunnel,"dns-tunnel");
            tunnelThread.start();
            return START_STICKY;
        } catch(Exception error) {android.util.Log.e("MFMC-DNS","Unable to start",error);stopSelf();return START_NOT_STICKY;}
    }
    private void runTunnel() {
        try(FileInputStream input = new FileInputStream(tun.getFileDescriptor())) {
            byte[] buf = new byte[32767];
            while(running) {
                int n=input.read(buf);
                if(n>0) {
                    byte[] frame=Arrays.copyOf(buf,n);
                    if(workers != null) workers.execute(()->processFrame(frame));
                }
            }
        } catch(Exception e) { if(running) android.util.Log.e("MFMC-DNS","Read failed",e); }
        if(running) stopSelf();
    }
    private void processFrame(byte[] frame) {
        if(!running || frame.length < 28 || (frame[0]>>4 & 0x0f)!=4) return;
        int ihl=(frame[0]&0x0f)*4;
        if(ihl<20 || frame.length<ihl+8 || (frame[9]&255)!=17) return;
        // Fragmented IPv4 packets aren't DNS messages we can safely parse.
        if((u16(frame,6)&0x3fff)!=0)return;
        int ipTotal = u16(frame,2);
        if(ipTotal < ihl+8 || ipTotal > frame.length)return;
        int sourcePort=u16(frame,ihl), destPort=u16(frame,ihl+2);
        int udpLen=u16(frame,ihl+4);
        if(destPort!=53 || udpLen<8 || ihl+udpLen>ipTotal)return;
        byte[] sourceIp=Arrays.copyOfRange(frame,12,16);
        byte[] destIp=Arrays.copyOfRange(frame,16,20);
        byte[] question=Arrays.copyOfRange(frame,ihl+8,ihl+udpLen);
        String host=questionDomain(question);
        if(host==null)return;
        byte[] answer;
        if(DomainRules.blocked(host,denied)) answer=errorResponse(question,3);
        else answer=queryUpstream(question);
        if(answer==null)answer=errorResponse(question,2);
        if(answer==null)return;
        byte[] result=ipv4Udp(destIp,sourceIp,destPort,sourcePort,answer);
        synchronized(writeLock){
            try { if(running && output!=null)output.write(result); }
            catch(Exception e) { if(running)android.util.Log.w("MFMC-DNS","Write failed",e); }
        }
    }
    static int u16(byte[] b,int p){return ((b[p]&255)<<8)|(b[p+1]&255);}
    static void put16(byte[] b,int p,int n){b[p]=(byte)(n>>>8);b[p+1]=(byte)n;}
    static String questionDomain(byte[] dns) {
        if(dns.length<17 || u16(dns,4)!=1)return null;
        int p=12;StringBuilder b=new StringBuilder();int labels=0;
        while(p<dns.length) {
            int len=dns[p++]&255;
            if(len==0){if(p+4>dns.length || b.length()==0)return null;return b.toString();}
            if(len>63 || len>dns.length-p || ++labels>32)return null;
            if(b.length()>0)b.append('.');
            for(int i=0;i<len;i++) {
                int ch=dns[p++]&255;
                if(ch<33 || ch>126)return null;
                b.append((char)ch);
            }
        }
        return null;
    }
    static byte[] errorResponse(byte[] query,int rcode) {
        if(query.length<12)return null;
        // Preserve the complete question (QDCOUNT=1) and drop EDNS records.
        int p=12;
        while(p<query.length) {int n=query[p++]&255;if(n==0)break;if(n>63||p+n>query.length)return null;p+=n;}
        if(p+4>query.length)return null;
        byte[] dns=Arrays.copyOf(query,p+4);
        int reqFlags=u16(query,2);
        put16(dns,2,0x8080|(reqFlags&0x0100)|(rcode&0x0f));
        put16(dns,4,1);put16(dns,6,0);put16(dns,8,0);put16(dns,10,0);
        return dns;
    }
    private byte[] queryUpstream(byte[] dns) {
        String[] resolvers={"9.9.9.9","1.1.1.1"};
        for(String ip:resolvers){
            try(DatagramSocket s=new DatagramSocket()){
                if(!protect(s))continue;
                s.setSoTimeout(1800);
                InetAddress dst=InetAddress.getByName(ip);
                s.send(new DatagramPacket(dns,dns.length,dst,53));
                byte[] data=new byte[4096];DatagramPacket r=new DatagramPacket(data,data.length);
                s.receive(r);
                if(r.getLength()<12)continue;
                if(data[0]!=dns[0] || data[1]!=dns[1])continue;
                return Arrays.copyOf(data,r.getLength());
            }catch(Exception e){android.util.Log.w("MFMC-DNS","Resolver unavailable: "+ip);}
        }
        return null;
    }
    private static long partial(byte[] b,int offset,int length,long sum){
        for(int i=0;i<length;i+=2){int hi=b[offset+i]&255;int lo=(i+1<length)?b[offset+i+1]&255:0;sum+=((hi<<8)|lo);}
        return sum;
    }
    private static int checksum(long sum){while((sum>>>16)!=0)sum=(sum&65535)+(sum>>>16);return (int)(~sum)&65535;}
    static byte[] ipv4Udp(byte[] source,byte[] target,int srcPort,int dstPort,byte[] payload){
        int udpLen=8+payload.length;int len=20+udpLen;
        byte[] out=new byte[len];out[0]=0x45;out[1]=0;put16(out,2,len);put16(out,4,0);put16(out,6,0);
        out[8]=64;out[9]=17;System.arraycopy(source,0,out,12,4);System.arraycopy(target,0,out,16,4);
        put16(out,10,checksum(partial(out,0,20,0)));
        put16(out,20,srcPort);put16(out,22,dstPort);put16(out,24,udpLen);
        System.arraycopy(payload,0,out,28,payload.length);
        long sum=0;sum=partial(out,12,8,sum);sum+=17+udpLen;sum=partial(out,20,udpLen,sum);
        int udpCheck=checksum(sum);put16(out,26,udpCheck==0?0xffff:udpCheck);
        return out;
    }
    @Override public void onDestroy() {
        running=false;
        ACTIVE = false;
        if(workers!=null){workers.shutdownNow();workers=null;}
        try{if(tun!=null)tun.close();}catch(Exception ignored){}
        tun=null;output=null;
        stopForeground(STOP_FOREGROUND_REMOVE);
        super.onDestroy();
    }
    @Override public void onRevoke(){stopSelf();}
}
